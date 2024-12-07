import React, { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import axios from 'axios'
import { Routes, Route, useNavigate } from "react-router-dom"
import Create from './Create'
import ProtectedRoute from '../ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage></LoginPage>}></Route>
      <Route path="/create" element={<ProtectedRoute><Create></Create></ProtectedRoute>}></Route>
    </Routes>
  )
}

function LoginPage() {
  
  const [loginInfo, setLoginInfo] = useState({username: '', password: ''})
  const [registerInfo, setRegisterInfo] = useState({username: '', password: ''})
  const [message, setMessage] = useState('')

  const navigate = useNavigate()

  const submitLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('http://localhost:3000/login', loginInfo)
      if (response.data.message === 'login successful') {
        localStorage.setItem('token', response.data.token)
        setMessage('login successful')
        navigate('/create')
      } else {
        setMessage(response.data.error)
      }
    } catch (error) {
      setMessage('login failed: ' + error.message)
    }
  }

  const submitRegister = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('http://localhost:3000/register', registerInfo)
      setMessage('registration successful')
    } catch (error) {
      setMessage('registration failed')
    }
  }

  return (
    
    <div id='main'>
      <div className='containerContainer'>
      
        <div className='container'>
          
          <form onSubmit={submitLogin}>
            <div className='header'>
              <div className='text'id='loginText'> Login</div>
            </div>

            <div className='inputs'>
              <div className='input'>
                <input onChange={e => setLoginInfo({...loginInfo, username: e.target.value})} className='inputText' type='username' placeholder='Username'></input>
              </div>

              <div className='input'>
                <input onChange={e => setLoginInfo({...loginInfo, password: e.target.value})} className='inputText' type='password' placeholder='Password'></input>
              </div>

            </div>

            <button type='submit' className='button'>Login</button>
          </form>
          
        </div>
      


        <div className='container'>
          
          <form onSubmit={submitRegister}>
            <div className='header'>
              <div className='text'id='loginText'> Register</div>
            </div>

            <div className='inputs'>
              <div className='input'>
                <input onChange={e => setRegisterInfo({...registerInfo, username: e.target.value})} className='inputText' type='username' placeholder='Username'></input>
              </div>

              <div className='input'>
                <input onChange={e => setRegisterInfo({...registerInfo, password: e.target.value})} className='inputText' type='password' placeholder='Password'></input>
              </div>

            </div>

            <button type='submit' className='button'>Register</button>
          </form>
        
        
        </div>

      </div>

      <p id='response'>{message}</p>

    </div>
  )
}

export default App