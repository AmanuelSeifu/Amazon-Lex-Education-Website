from flask import Flask,request#session
from LexBot import trainBot,getAnswer, DeleteBot

from flask_sqlalchemy import SQLAlchemy
from flask_session import Session
from flask_login import UserMixin, LoginManager, login_user, logout_user, login_required,current_user,AnonymousUserMixin
from flask_bcrypt import Bcrypt
import random


app = Flask(__name__)
login_manager = LoginManager(app)

app.config['SQLALCHEMY_DATABASE_URI'] =  'sqlite:///site.db'

app.config["SECRET_KEY"] = "supersecret123"

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

db = SQLAlchemy(app)

bcrypt = Bcrypt(app)

class BotBase(UserMixin,db.Model):
    __tablename__ = "BotBase" 
    id = db.Column(db.Integer, primary_key=True)
    botCode = db.Column(db.String(128),unique=True)
    botId = db.Column(db.String(128))
    botName = db.Column(db.String(128))
    def __repr__(self):
        return f'<BotBase {self.botCode}>'


class User(UserMixin,db.Model):
    __tablename__ = "Users"
    id = db.Column(db.Integer, primary_key=True)#KEEP!! THIS IS ASSIGNED AUTOMATICALLY!!!
    name = db.Column(db.String(64), unique=False)
    email = db.Column(db.String(64), unique=True)
    password_hash = db.Column(db.String(128))
    botNames = db.Column(db.String(128))
    botIds = db.Column(db.String(128))
    botCodes = db.Column(db.String(128),unique=False)
    botHists = db.Column(db.Integer,unique=False)
    botCurrs = db.Column(db.Integer,unique=False)
    #list of strings which are bot names/ID's
    #list of strings which are hexidecimal codes  
    def __repr__(self):
        return f'<User {self.email}>'

#db.init_app(app)
with app.app_context():
    db.create_all()





@login_manager.user_loader
def load_user(user_id):
  return User.query.get(user_id)


@app.route('/register',methods=["POST","GET"])
def register():
    name = request.form["name"]
    email = request.form["email"]
    password = request.form["password"]
    if request.method == "POST" and User.query.filter_by(email=email).first() == None:
        try:
            hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
            new_user = User(name=name, email=email, password_hash=hashed_password,
                             botNames="", botIds = "", botCodes="",botHists=0,botCurrs=0)
            db.session.add(new_user)
            db.session.commit()
            login_user(new_user)
            #session["user_id"] = new_user.id
            return {"complete": True}
        except NameError:
            print(NameError)
            return {"complete": False}
    return {"complete": False}
     
@app.route("/login",methods=["POST","GET"])
def login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]
        user = User.query.filter_by(email=email).first()
        print(user)
        if user and bcrypt.check_password_hash(user.password_hash,password):
            login_user(user)
            return {"complete": True}
    print("failed")
    return {"complete": False}


@app.route("/logout")
#@login_required
def LogOut():
    #session.pop("user_id")
    logout_user()
    print("Log Out")
    return {"complete": True}


@app.route("/@me")
def GetUser():
    #user_id = session.get("user_id")
    user = current_user
    #print(user_id)
    #user = User.query.filter_by(id=user_id).first()

    return {
        "id":user.id,
        "name": user.name,
        "email": user.email,
        "botNames":user.botNames,
        #"botIds": user.botIds,
        "botCodes":user.botCodes
    }



@app.route('/TrainBot',methods = ["POST","GET"])
def TrainBot():
    questList = request.form["questions"].split("?,")
    answList = request.form["answers"].split(".,")
    utterList = request.form["utters"].split("~")
    name = request.form["name"]
    for i in range(len(utterList)-1):
        utterList[i] = utterList[i].split(",")
        if i == 0:
            utterList[i] = utterList[i][0:len(utterList[i])-1]
        else:
            utterList[i] = utterList[i][1:len(utterList[i])-1]
    utterList = utterList[0:len(utterList)-1]

    for i in range(len(questList)-1):
        questList[i] = questList[i]+"?"
        answList[i] = answList[i]+"."

    if (int(User.query.filter_by(email=current_user.email).first().botCurrs) >= 6):
        return {"complete":False}
    
    userNum = User.query.filter_by(email=current_user.email).first().id
    botTotalNum = User.query.filter_by(email=current_user.email).first().botHists
    
    botIdName = trainBot(questList, utterList, answList,userNum,botTotalNum)

    newCode = random.randrange(4096,65535)
    newCode = (str(userNum) + hex(newCode)).upper()

    current_user.botNames += name if  current_user.botNames == "" else ", " + name
    current_user.botIds += botIdName if  current_user.botIds == "" else ", " + botIdName
    current_user.botCodes += newCode if  current_user.botCodes == "" else ", " + newCode
    current_user.botHists += 1
    current_user.botCurrs += 1
    db.session.commit()

    newBase = BotBase(botCode = newCode, botId = botIdName, botName = name)
    db.session.add(newBase)
    db.session.commit()
    print(newCode)
    return {"botCode": newCode,"complete":True}
    
    
@app.route('/AskBot',methods = ["POST","GET"])
def AskBotServ():
    print(request.form["botCode"])
    nameId = BotBase.query.filter_by(botCode=request.form["botCode"]).first().botId
    print(nameId)
    return {"response":getAnswer(request.form["userQuestion"],nameId)}


@app.route("/isLoggedIn")
def CheckLoggedIn():
    return {"logged": current_user.is_authenticated}


@app.route('/DeleteBot',methods = ["POST","GET"])
def DeleBot():
    botNum = int(request.form["botNum"])
    nameList = current_user.botNames.split(", ")
    codeList = current_user.botCodes.split(", ")
    idList = current_user.botIds.split(", ")
    botIdName = idList[botNum]
    nameList.pop(botNum)
    oldCode = codeList.pop(botNum)
    idList.pop(botNum)
    DeleteBot(botIdName)

    current_user.botNames = "".join(nameList)
    current_user.botCodes = "".join(codeList)
    current_user.botIds = "".join(idList)
    current_user.botCurrs -= 1
    db.session.commit()

    BotBase.query.filter_by(botCode=oldCode).delete()
    db.session.commit()

    return {"success": False}

@app.route('/IsCodeRight',methods = ["POST","GET"])
def CodeRight():
    code = request.form["code"]
    print(BotBase.query.filter_by(botCode=code).first())
    return {"isValid":BotBase.query.filter_by(botCode=code).first()!=None}

if __name__ == '__main__':
    app.run(debug=True)


