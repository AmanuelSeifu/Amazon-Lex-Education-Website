import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './App.css';
import trash3 from "./svgs/trash3-fill.svg";
import ImProfile from "./svgs/person-square.svg";
import HomeIcon from "./svgs/house-door.svg";
import CloudIcon from "./svgs/cloud-download.svg";
import FileIcon from "./svgs/file-earmark-arrow-up.svg";
import pdfToText from 'react-pdftotext';
import Papa from "papaparse";

function EnterIntentPage() {
    const [data, setData] = useState({
      questions : [],
      utters : [],
      answers : []
    });
    const [questVal, setQuestVal] = useState("");
    const [answVal, setAnswVal] = useState("");
    const [nameVal,setNameVal] = useState("");
    var navigate = useNavigate();
    
    useEffect(() => {
      fetch("/isLoggedIn").then((res) =>
          res.json().then((data) => {
            if (!data["logged"]) {
              navigate("/");
            }
          })
      );
    }, []);

    function enterIntent() {
      if (questVal !== "" && answVal !== "") {
        var newQuestVal = questVal.split("\n");
        var newAnswVal = answVal;
        var newUtterances = [];
        for (var i = 0; i < newQuestVal.length;i++) {
          if (newQuestVal[i][newQuestVal[i].length-1] !== "?") 
            newQuestVal[i] += "?";
          if (i!==0)
            newUtterances.push(newQuestVal[i]);
        }
        newUtterances.push("~");
  
        if (answVal[answVal.length-1] !== ".") 
          newAnswVal += ".";
  
        setData({questions: [...data.questions, newQuestVal[0]], utters: [...data.utters, newUtterances], answers: [...data.answers, newAnswVal]});
        setQuestVal("");
        setAnswVal("");
      }
    }
  
    function deleteIntent(num) {
      var newQuestList = [...data.questions];
      var newAnswList = [...data.answers];
      var newUtterList = [...data.utters];
      newQuestList.splice(num,1);
      newAnswList.splice(num,1);
      newUtterList.splice(num,1);
      setData({questions:newQuestList,utters:newUtterList,answers:newAnswList});
    }
  
    function intentList() {
      var list = []
      for (let i = 0; i < data.questions.length; i++) {
        list.push(
        <div key={i} className="intentBox">
          <div>
            <p className="Para">
              {data.questions[i]}
              <br/> 
              {data.answers[i]}
            </p>
          </div>
          <div>
            <button type="button" className = "deleteBut" onClick={()=>deleteIntent(i)}><img src={trash3}/></button>
          </div>
        </div>);
        list.push(<br/>);
      }
      return <dl>{list}</dl>;
    }
  
    function Train() {
        if (data.questions.length >0 && nameVal.search((/^[a-z0-9_\-]+$/i)) != -1 ) {
            var form = new FormData();
            
            form.append("questions",data.questions);
            form.append("utters",data.utters);
            form.append("answers",data.answers);
            form.append("name",nameVal);
            
            //pageFunc(1);
            navigate("/Loading");
            fetch("/TrainBot",{method : "POST",body: form}).then(
              (res)=>res.json().then((info)=>{
                if(info["complete"])
                  navigate("/Ask",{state: {botCode : info["botCode"]}})
                else {
                  window.confirm('ChatBot creation limit reached, delete an existing chatbot.');
                  navigate("/Account")
                }
              }));
        } else {
          if (nameVal.search((/^[a-z0-9_]+$/i)) == -1 )
            window.confirm("Your chatbot name must be alphanumeric (only letters, numbers, and underscores).");
          else
            window.confirm('You must have at least one \"intent\".');
        }
    }
    
    function DownloadSample() {
      fetch("Sample.pdf").then((response)=> response.blob().then(
        (blob)=> {
          let alink = document.createElement("a");
          alink.href = window.URL.createObjectURL(blob);
          alink.download = "SamplePDF.pdf";
          alink.click();
        }
      ))
    }


    function handleChange(file) {
      if (file.name.split(".")[1] === "pdf") {
        pdfToText(file).then(text=>{
          var textList = text.replace("  "," ").replace("   "," ").split(".");
          if (textList[textList.length-1]==="")
            textList.pop();
          var questionList = [];
          var utterList = [];
          var answerList = [];
          for (var i = 0; i < textList.length; i++) {
            utterList.push([]);
            var section = textList[i].split("?");
            for (var x = 0; x < section.length; x++) {
              if (section[x][0]===" ") {
                section[x] = section[x].slice(1,section[x].length);
                if (section[x][0]===" ")
                  section[x] = section[x].slice(1,section[x].length);
              }
              if (x===0){
                questionList.push(section[x]+"?");
              }
              else if (x===section.length-1) {
                answerList.push(section[x]+".");
              }
              else {
                utterList[i].push(section[x]+"?");
              }
            }
            utterList[i].push("~");
          }
          setData({questions:data.questions.concat(questionList),utters:data.utters.concat(utterList),answers:data.answers.concat(answerList)});
          
        });
      } /*else {//csv
        var hel = Papa.parse(file,{
          header: true,
          skipEmptyLines: true,
          complete: function (csv) {
            var questionList = [];
            var answerList = [];
            const parsedData = csv?.data;
            const rows = Object.keys(parsedData[0]);
            console.log(rows);
            console.log(parsedData);
            questionList.push(rows[0]);
            answerList.push(rows[1]);
            for (var i = 0; i < parsedData.length; i++) {
              questionList.push(parsedData[i][rows[0]]);
              answerList.push(parsedData[i][rows[1]])
            }
            setData({questions:data.questions.concat(questionList),answers:data.answers.concat(answerList)});
        }});
      
      }*/
    }
  
  
    return (
      <div className="IntentWhole">
        <div className="Top">
          <button className="ProfileInp" onClick={()=>navigate("/Home")}>
            <img src={HomeIcon} className="profile" />
          </button>
          <h2 className="TrainTitle">Train An Amazon Lex Chatbot</h2>
          <button className="ProfileInp" onClick={()=>navigate("/Account")}>
            <img src={ImProfile} className="profile" />
          </button>
        </div>
        <div className='Intents'>
          <div className="Intent-Display" >
            <h3 className='NameTitle'>Name:</h3>
            <input type = "text" className ="NameInput" value = {nameVal} maxLength="20" onChange={e => setNameVal(e.target.value)} placeholder="Name of Your Bot..." size = "40"/>
            <h3 className='DispTitle'>Intents:</h3>
            <div className = "boxList">
              {intentList()}
            </div>
            <br/>
            <button type="button" className = "TrainBut" onClick={() => Train()}>Train</button>
          </div>
          <hr className='Line'/>
          <div className="Intent-Enter">
            <div>
              <h3 className='Enter'>
                Enter Question(s) Here:
              </h3 >
              <textarea type = "text" className ="TextArea" value = {questVal} onChange={e => setQuestVal(e.target.value)} placeholder="Ex: What are ants?&#10;Ex: Are ants insects?&#10;Ex: Are ants animals?" size = "40"/>
              <br/>
              <h3 className='Enter'>
                Enter Answer Here:
              </h3>
              <input type = "text" className ="Input" value = {answVal} onChange={e => setAnswVal(e.target.value)} placeholder="Ex: Ants are insects." size = "40"/>
            </div>
            <br/>
            <button type="button" className = "IntentBut" onClick={() => enterIntent()}>Enter Intent</button>
            <div className="OrStyleIntent">
                <hr className="breakIntent"/>
                <h5 className="OrTextIntent">OR</h5>
                <hr className="breakIntent"/>
            </div>
            <div className="FileBox">
              <h3 className="AttatchTitle">Attatch PDF</h3>
              <button className= "DownloadBut" onClick={()=>DownloadSample()}><img src={CloudIcon}/>Download PDF Example</button>
              <div className="ChooseDiv">
                <img src={FileIcon}/>
                <label for="ChooseInp" className="ChooseText">Choose File</label>
                <input type="file" id="ChooseInp" accept=".pdf" onChange={e=>handleChange(e.target.files[0])}></input>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}


export default EnterIntentPage;