import React, { useState, useEffect,useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
//import './App.css';
import "./Ask.css"
import "./Home.css"
import "./Account.css"
import "./Load.css"
//import pdfToText from 'react-pdftotext'
//import Papa from "papaparse";
//import trash3 from "./svgs/trash3-fill.svg";

import { MdLogout} from "react-icons/md";
import send from "./svgs/send.svg";
import ImProfile from "./svgs/person-square.svg";
import HomeIcon from "./svgs/house-door.svg";
import BotIcon from "./svgs/chat-bot.svg";
import LogIcon from "./svgs/box-arrow-in-right.svg";
import trash3 from "./svgs/trash3-fill.svg";

import EnterIntentPage from "./IntentPage.js";
import {LogIn, CreateAcc} from "./LogIn.js";



function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route index element={<LogIn />}/> 
          <Route path="/Create" element={<CreateAcc />}/>
          <Route path="/Home" element={<Home />}/>
          <Route path="/Account" element={<Account />}/>
          <Route path="/Intent" element={<EnterIntentPage />}/>
          <Route path="/Loading" element={<Load />}/>
          <Route path="/Ask" element={<Ask />}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const [logged,setLogged] = useState(null);
  const [code,setCode] = useState(null);
  
  function IsCodeRight() {
    var form = new FormData();
    form.append("code",code);
    fetch("/IsCodeRight",{method : "POST",body: form}).then(
      (res)=>res.json().then((data) => {
        if (data["isValid"])
          navigate("/Ask",{state:{botCode: code}})
        else {
          setCode("");
          window.confirm("Code doesn't exist.");
        }
    }));
    //check if code is right
    //navigate("/Ask",{state: {botCode: code}})
  }
  
  useEffect(() => {
      fetch("/isLoggedIn").then((res) =>
          res.json().then((data) => {
            setLogged(data["logged"]);
          })
      );
  }, []);
  
  return (
    <div className="Home">
      <div className="Top">
        <button className="ProfileInp" onClick={()=>navigate("/Home")} disabled={!logged}>
          <img src={HomeIcon} className="profile" />
        </button>
        <h2 className="Title">Get started with a Chatbot</h2>
        <button className="ProfileInp" onClick={()=>navigate("/Account")} hidden={!logged}>
          <img src={ImProfile} className="profile"/>
        </button>
      </div>
      <div className="Options">
        <div className="Train">
          <button type="button" className="ChooseButton" disabled={!logged} onClick={()=>navigate("/Intent")}>Train a Chatbot</button>
          {logged? <div> </div>:(<div><button type="button" className="ChooseButton" onClick={()=>navigate("/")} >Log In</button></div>)}
        </div>
        <div className="OrStyleVert">
                <hr className="breakVert"/>
                <h5 className="OrTextVert">OR</h5>
                <hr className="breakVert"/>
        </div>
        <div className="Code">
          <h5 className="Use">Use a Chabot</h5>
          <input className="CodeInp" type="text" value={code} onChange={(e)=>setCode(e.target.value.toUpperCase())} maxLength="7" placeholder="#######"></input>
          <button type="button" className="ChooseButton" onClick={()=>IsCodeRight()}>Use Bot</button>
        </div>
      </div>
    </div>
  );
}

function Load() {
  return (
    <div className='Load'>
      <h1>Loading</h1>
      <div class="loader"></div>
    </div>
  );
}

function Ask() {
  const {state} = useLocation();
  var botCode = null;
  if (state != null)
    botCode = state["botCode"];
  const [response, setResponse] = useState(["Hello, ask a question!"]);
  const [userQuest, setUserQuest] = useState([]);
  const [currQuest,setCurrQuest] = useState("");
  const [pending,setPending] = useState(false);
  const [logged,setLogged] = useState(null);
  const navigate = useNavigate();
  var scrollRef = useRef(null);

  useEffect(() => {
    if (botCode === null)
      navigate("/Home");
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    fetch("/isLoggedIn").then((res) => 
      res.json().then((data) => {
        setLogged(data["logged"]);
      }
    )
    );
    
  },[]);

 function AskBot() {
    var form = new FormData();
    var checkQuest = currQuest;
    if (checkQuest!="" && pending === false) {
      if (checkQuest[checkQuest.length-1] !== "?")
        checkQuest += "?";
      form.append("userQuestion",currQuest);
      form.append("botCode",botCode);
      setPending(true);
      setUserQuest([...userQuest,currQuest]);
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      fetch("/AskBot",{method : "POST",body: form}).then((res)=>res.json().then((data) => {
        setResponse([...response,data.response]);
        setPending(false);
      }));
      setCurrQuest("");
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });

    }
 }

 function DialogueBox() {
    var list = [];
    for (var i = 0; i < response.length;i++) {
      var last = i + 1 == response.length;
      list.push(
        <p ref = {last? scrollRef: null}  key={i+response.length} className='responseText'> 
            {response[i]}
        </p>
      );
      if (i < userQuest.length) {//prevents question list from overflow
        list.push(
          <p ref = {last? scrollRef: null} key={-i - userQuest.length}className='questText'> 
                {userQuest[i]}
          </p>
        );
      }
    }
    return <div className='DialogueWindow'>{list}</div>;
 }

 function showUI() {
  if (logged!=null) {
    return (
      <div className='Ask'>
        <div className="Top">
            <button className="ProfileInp" onClick={()=>navigate("/Home")}>
              <img src={HomeIcon} className="profile" />
            </button>
            <h2 className='AskText'>Ask the bot some questions!</h2>
            <button className="ProfileInp" onClick={()=>navigate("/Account")} hidden={!logged}>
              <img src={ImProfile} className="profile" />
            </button>
        </div>
        <div className="AskBody">
          <div className='DialogueBox'>
            {DialogueBox()}
            <div className='MSGBox'>
              <input type = "text" className='QuestInp' value = {currQuest} onChange={e => setCurrQuest(e.target.value)} onKeyDown={event => {
                    if (event.key === 'Enter') {
                      AskBot();
                    }
                  }} size = "40" />
              <button className='SendMSG' onClick={()=>AskBot()}><img src={send}/></button>
            </div>
          </div>
          <div className="CodeSide">
            <img src={BotIcon}/>
            <h2 className="ChatTitle">Let's Chat!</h2>
            <div className="CodeBox">
              <h4 className="CodeText">Code:</h4>
              <h4 className="CodeText">{botCode}</h4>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return <div></div>;
 }

  return (
    showUI()
  );
}

//Uses Home.css for styling 
function Account() {
  const navigate = useNavigate();
  const [info,setInfo] = useState({});
  const [botList,setBotList] = useState([]);
  const [del, setDel] = useState(false);

  useEffect(() => {
    //navigate("/Loading");
    fetch("/isLoggedIn").then((res) =>
        res.json().then((data) => {
          if (!data["logged"]) {
            navigate("/");
          } else {
            fetch("/@me").then((res) =>
              res.json().then((data2) => {
                //navigate("/Account");
                setInfo(data2);
                MakeBotList(data2);
            }));
          }
        })
    );
  }, []);

  

  function DeleteBot(num) {
    if(window.confirm('Delete the Chatbot?')) {
      setDel(false);
      var form = new FormData();
      form.append("botNum",num);
      navigate("/Loading");
      fetch("/DeleteBot",{method : "POST",body: form}).then((res) =>
        navigate("/Account"));
    }
  }

  function MakeBotList(data) {
    var list = [];
    var botNames = data.botNames.split(",");
    var botCodes = data.botCodes.split(",");
    if (botNames[0]=="")
      return;
    for (let i = 0; i < botNames.length; i++) {
      if (i!=0) {
        botNames[i].slice(1,botNames[i].length);
        botCodes[i].slice(1,botCodes[i].length);
      }
      list.push(
        <div key={i} className="BotContainer">
          <img className="BotIconDesc" src={BotIcon}/>
          <div className="BotDesc">
            <h6 className="BotText">{botNames[i]}</h6>
            <h6 className="BotText">Code: {botCodes[i]}</h6>
          </div>
          <button className="DelBut" onClick={()=>DeleteBot(i)}>
            <img className="DelBotIcon" src={trash3}/>
          </button>
        </div>
      );
    }
    setBotList(list);
  }

  function logOut() {
    fetch("/logout").then(navigate("/"));//(res)=>res.json().then((data) => console.log(data))
  }

  function showUI() {
    if (info.name!=null) {
      return (
      <div className="Account">
      <div className="Top">
        <button className="ProfileInp" onClick={()=>navigate("/Home")}>
          <img src={HomeIcon} className="profile" />
        </button>
        <h2 className="Title">Account</h2>
        <button className="ProfileInp" onClick={()=>logOut()}>
          <img src={LogIcon} className="profile" />
        </button>
      </div>
      <div className="Details">
        <div className="AccountBox">
          <img src={ImProfile} className="AccountImage"/>
          <div className="AccountInfo">
            <h4 className="InfoText">{info.name}</h4>
            <h4 className="InfoText">ID: {info.id+2375}</h4>
          </div>
        </div>
        <hr className="breakAcc"/>
        <div className="BotGroup">
          <h3 className="BotTitle">Bots</h3>
          <div className="BotBox">
            {botList}
          </div>
        </div>
      </div>
      </div>
      );
    }
    return <div></div>
  }

  return (
    showUI()
  );
}




export default App;

