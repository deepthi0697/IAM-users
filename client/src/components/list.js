import React from 'react'
import axios from 'axios'
import Popup from "reactjs-popup"

class UsersList extends React.Component{
    constructor(){
        super()
        this.state = {
            users : [],
            user: ''
        }
    }

    componentDidMount = () => {
        axios.get('https://z0a7zr6y84.execute-api.us-east-1.amazonaws.com/dev/users')
            .then(response => {
                const users = response.data
                //console.log(users)
                this.setState({users})
            })
            .catch((err) => {
                //console.log(err)
            })
    }

    handleChange = (e) => {
        this.setState({
            user: e.target.value
        })
    }

    handleMore = (id) => {
        this.setState(prevState => {
            return {
                users: prevState.users.map(user => {
                    if(user.userId === id){
                        return Object.assign({}, user, {showDetails: !user.showDetails})
                    } else {
                        return Object.assign({}, user)
                    }
                })
            }
        })
    }
    
    handleDelete = (sentUser) => {
        axios.delete("https://cors-anywhere.herokuapp.com/" +'https://z0a7zr6y84.execute-api.us-east-1.amazonaws.com/dev/users',{data: sentUser})
            .then((response) => {
                //console.log(response.data)
                this.setState((prevState) => {
                    return {
                        users: prevState.users.filter(user => user.userId !== sentUser.userId )
                    }
                }, () => {alert('user deleted successfully')})
               
            })
            .catch((err) => {
                //console.log(err)
            })
    }

    handleSubmit = (e) => {
        e.preventDefault()
        const formData = {
            name: this.state.user
        }
        axios.post("https://cors-anywhere.herokuapp.com/" + 'https://z0a7zr6y84.execute-api.us-east-1.amazonaws.com/dev/users', formData)
            .then((response) => {
                //console.log(response.data)
                const data = response.data
                this.setState((prevState) => {
                    return {
                        users: [...prevState.users, {Date: data.User.CreateDate, Arn: data.User.CreateDate, name: data.User.UserName, userId: data.User.UserId}]
                    } 
                })
               axios.get('https://z0a7zr6y84.execute-api.us-east-1.amazonaws.com/dev/sync')
               alert('User added successfully.')
            })
            .catch((err) => {
                //console.log(err)
            })
    }
    render(){
        return (
            <div className="col-12">
                <h1 className="display-4"><strong>Listing {this.state.users.length} IAM Users</strong></h1>
                        {/* Creation of user */}
                        <Popup trigger={ <button type="button" className="btn btn-info float-right">Create User</button>} position="left center">
                            <label htmlFor = 'add'>Add user</label>
                            <form onSubmit = {this.handleSubmit}>
                                    <input type = 'text' id = 'add' value = {this.state.addUser} onChange = {this.handleChange}/>
                            
                                <input className="btn btn-primary" type = 'submit' value = 'Create'/>
                            </form>
                        </Popup>
                      

                    {/* Users List */}
                    <div className="col-8 clearfix">
                    {
                        this.state.users.length === 0 ? 
                        <div className="spinner-border" role="status">
                            <span className="sr-only">Loading...</span>
                        </div> : (
                            <ul className="list-group ">
                                {
                                    this.state.users.map(user => {
                                        return (
                                            user.showDetails ? (
                                                <li className="list-group-item list-group-item-secondary" key = {user.id}>
                                                    {user.name}
                                                    <div className="card" >
                                                    <div className="card-header">
                                                         Details
                                                    </div>
                                                    <ul className="list-group list-group-flush">
                                                        <li className="list-group-item">Name: {user.name}</li>
                                                        <li className="list-group-item">User ID: {user.userId}</li>
                                                        <li className="list-group-item">Arn: {user.Arn}</li>
                                                        <li className="list-group-item">Created on: {user.Date}</li>
                                                    </ul>
                                                </div>
                                                <button className="btn btn-danger float-right" onClick = {() => {this.handleDelete(user)}}>Delete</button>
                                                <button type="button" className="btn btn-info float-right" onClick = {() => {this.handleMore(user.userId)}}>Back</button>
                                            </li>
                                            
                                        ) : (
                                            <li className="list-group-item list-group-item-secondary" key = {user.id}>
                                                {user.name} 
                                                <button type="button" className="btn btn-danger float-right" onClick = {() => {this.handleDelete(user)}}>Delete</button>
                                                <button type="button" className="btn btn-info float-right" onClick = {() => {this.handleMore(user.userId)}}>More</button> 
                                                
                                            </li>
                                        )
                                    )
                                })
                            }
                        </ul>
                    )
                }
               
                    </div>
            </div>
        )
    }
}

export default UsersList