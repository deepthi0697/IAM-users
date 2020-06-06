const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const AWS = require('aws-sdk');
const cors = require('cors')

const USERS_TABLE = process.env.USERS_TABLE;
const iam = new AWS.IAM({apiVersion: '2010-05-08'});

app.use(cors())

const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDb;
if (IS_OFFLINE === 'true') {
  dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  })
  console.log(dynamoDb);
} else {
  dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });
};


app.use(express.json())

app.use(bodyParser.json({ strict: false }));


app.get('/', function (req, res) {
  res.send('Hello World!')
})


//Sync
app.get('/sync', function(req, res) {
  const IAMparams = {
    MaxItems: 20
  };

  iam.listUsers(IAMparams, function(err, data) {
    if (err) {
      res.json("Error", err);
    } else {
      const users = data.Users || [];
      res.json(users)
      users.forEach((user) => {
        const input = {
            "userId": user.UserId,
            'name': user.UserName,
            'Arn': user.Arn,
            'Date': JSON.stringify(user.CreateDate),
            'showDetails': false
        }
        const params = {
            TableName: USERS_TABLE,
            Item: input
        }
        dynamoDb.put(params, (error, result) => {
            if (error) {
              //console.log('error',error);
              res.status(400).json({ error: 'Could not get user' });
            }
            console.log(result)
          });
      });
      
    }
  });
})


//Listing users
app.get('/users', function (req, res) {
     const params = {
        TableName: USERS_TABLE,
        ProjectionExpression: "userId, #name, #arn, #date",
        ExpressionAttributeNames: {
            "#name": "name",
            "#arn": "Arn",
            "#date": "Date"
        }
      }
        console.log("Scanning table.")
        dynamoDb.scan(params, onScan)
        function onScan(err, data) {
          console.log('inside scan')
          if (err) {
              res.json("Unable to read item.", err);
          } 
          else {
              console.log("Scan succeeded.");
              res.json(data.Items)

            
          }
      }
})


//single user details
app.get('/users/:userId', function (req, res) {
    const params = {
      TableName: USERS_TABLE,
      Key: {
        userId: req.params.userId
      }
    }
  
    dynamoDb.get(params, (error, result) => {
      if (error) {
        console.log(error);
        res.status(400).json({ error: 'Could not get user' });
      }
      if (result.Item) {
        // const {userId, name} = result.Item;
        res.json(result.Item);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    });
  })
  
  // create IAM user
  app.post('/users', function (req, res) {
    const name = req.body.name
    console.log(req.body)
     const params = {
      UserName: name
    }
    iam.getUser(params, function(err, data) {
      if (err && err.code === 'NoSuchEntity') {
        iam.createUser(params, function(err, data) {
          if (err) {
            res.status(400).json(err);
          } else {
            res.status(200).json(data);
          }
        });
        
      } 
      else {
        res.json("User " + name + " already exists", data.User.UserId);
        console.log('user alreay exists')
      }
    });
  })

  //Delete a user
  app.delete('/users', function(req, res){
    const params = {
      UserName: req.body.name
    };
    
    iam.getUser(params, function(err, data) {
      if (err && err.code === 'NoSuchEntity') {
        console.log("User " + req.body.name + " does not exist.");
      } else {
        iam.deleteUser(params, function(err, data) {
          if (err) {
            res.status(400).json(err)
          } else {
            res.status(200).json(data);
            const params1 = {
              TableName: USERS_TABLE,
              Key: {
                userId: req.body.userId
              }
            }
            dynamoDb.delete(params1, function(err, data) {
              if (err) {
                res.status(400).json(err);
              } else {
                res.status(200).json(data);
              }
            })
          }
        });
      }
    });

  })

  

module.exports.handler = serverless(app);