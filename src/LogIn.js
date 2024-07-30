import React, { useState, useEffect, useDebugValue } from "react";
import { Outlet, Link } from "react-router-dom";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import './App.css';
import './LogIn.css';


function LogIn() {
    const [email,setEmail] = useState("");
    const [pass,setPass] = useState("");
    const [wait,setWait] = useState(false)
    const navigate = useNavigate();
    function loggingIn() {
        var form = new FormData();
        form.append("email",email);
        form.append("password",pass);
        setWait(true);
        fetch("/login",{method : "POST",body: form}).then(
            (res)=> {res.json().then((data) => {
                if (data.complete)
                {
                    navigate("/Home",{state:{logged:true}});
                } else {
                    setWait(false)
                    setEmail("")
                    setPass("")
                    window.confirm("Wrong email or password.");
                }
            })}
        );
    }
    function createAccount() {
        navigate("/Create");
    }
    return (
        <div className="LogIn">
            <h2 className="LogInTitle">Welcome to Amazon Lex Connector</h2>
            <div className="LogBox">
                <input className="Inp" type="text" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)}/>
                <input className="Inp" type="password" placeholder="Password" value={pass} onKeyDown={event => {
                    if (event.key === 'Enter') {
                        loggingIn();
                    }
                  }} onChange={(e)=>setPass(e.target.value)}/>
                <button type="button" className="Button" onClick={()=>loggingIn()}  disabled = {wait}>Log In</button>
                <a className="link" onClick={()=>navigate("/Home",{state:{logged:false}})}>Continue As Student</a>
            </div>
            <div className="OrStyle">
                <hr className="break"/>
                <h5 className="OrText">OR</h5>
                <hr className="break"/>
            </div>
            <button type="button" className="Button" onClick={()=>createAccount()}>Create Account</button>
            <div  className = "Credit">
                <a className = "CreditLink" href="https://aws.amazon.com/what-is-cloud-computing"><img className="CreditImage" src="https://d0.awsstatic.com/logos/powered-by-aws-white.png" alt="Powered by AWS Cloud Computing"/></a>
            </div>
        </div>
    );
}


function CreateAcc() {
    const [name,setName] = useState("");
    const [email,setEmail] = useState("");
    const [pass,setPass] = useState("");
    const [confirmPass,setConfirmPass] = useState("");
    const [wait,setWait] = useState(false)
    const navigate = useNavigate();

    function register() {
        var form = new FormData();
        form.append("name",name);
        form.append("email",email);
        form.append("password",pass);

        if (pass === confirmPass) {
            setWait(true);
            fetch("/register",{method : "POST",body: form}).then(
                (res)=> {res.json().then((data) => {
                    if (data.complete)
                    {
                        navigate("/Home",{state:{logged:true}});
                    } else {
                        setWait(false);
                        setName("");
                        setEmail("");
                        setPass("");
                        setConfirmPass("");
                        window.confirm("Email already has an account.");
                    }
                })}
            );
        } else {
            setWait(false);
            setName("");
            setEmail("");
            setPass("");
            setConfirmPass("");
            window.confirm("Passwords don't match.");
        }

    }
    return (
        <div className="LogIn">
            <h2 className="LogInTitle">Create An Account</h2>
            <div className="CreateBox">
                <input className="Inp" type="text" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)}/>
                <input className="Inp" type="text" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)}/>
                <input className="Inp" type="password" placeholder="Password" value={pass} onChange={(e)=>setPass(e.target.value)}/>
                <input className="Inp" type="password" placeholder="Confirm Password" value={confirmPass} onChange={(e)=>setConfirmPass(e.target.value)}/>

                <button type="button" className="Button" disabled={wait} onClick={()=>register()}>Create Account</button>
                <label className="AlrdyAcc">Already have an Account? <a className="link" onClick={()=>navigate("/")}>Log In.</a></label>
            </div>
            
        </div>
    );
}



export {LogIn, CreateAcc};