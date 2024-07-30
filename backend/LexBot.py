import boto3
import time
import string
import pdfreader
from pdfreader import PDFDocument, SimplePDFViewer
import csv

key_id = "" #Add AWS key id
secret_key = "" #Add AWS key

def intentToName(intent,i):
  return (intent.replace(" ","_").replace("?","").replace(".","")[0:50]+str(i))
def delayTill(prevVal,client,lambdy):
  iterMax = 20
  while iterMax != 0:
    time.sleep(1)
    if prevVal != lambdy(client):
      return
    iterMax -= 1
def delayTillEqual(prevVal,client,lambdy):
  iterMax = 20
  while iterMax != 0:
    time.sleep(1)
    if prevVal == lambdy(client):
      return
    iterMax -= 1

def getSampleUtteranes(question,utters):
    lst = [question] + utters
    json = []
    for i in range(len(lst)):
       json.append({"utterance":lst[i]})
    return json

def getAnswer(question,botID):
    session = boto3.Session(
        aws_access_key_id = key_id,#Not safe
        aws_secret_access_key = secret_key
    )
    client = session.client('lexv2-models',region_name='us-east-1')
    """
    response = client.list_bots()
    for dic in response["botSummaries"]:
        if dic["botName"] == name:
            botID = dic["botId"]
            break
    """
    alias = client.list_bot_aliases(botId = botID,maxResults=123)["botAliasSummaries"][0]["botAliasId"]
    client2 = session.client('lexv2-runtime',region_name='us-east-1')
    answer = client2.recognize_text(
        botId=botID,
        botAliasId= alias,
        localeId="en_US",
        sessionId = "testSession",
        text=question
    )
    if "messages" not in answer:
        return "Please reword your question."
    return answer["messages"][0]["content"]

def trainBot(questions,utters,answers,userNum,currBots):
    intentIds = []
    
    session = boto3.Session(
        aws_access_key_id = key_id,
        aws_secret_access_key = secret_key
    )
    client = session.client('lexv2-models',region_name='us-east-1')

    #newLambda = lambda client: len(client.list_bots()["botSummaries"])
    response = client.list_bots()
    newBotName = "Bot_" + str(currBots)+"_"+str(userNum)
    """
    for dic in response["botSummaries"]:
        if dic["botName"] == botName:
            client.delete_bot(botId=dic["botId"])
            delayTill(len(response["botSummaries"]),client,newLambda)
            break
    """

    response2 = client.create_bot(
        botName=newBotName,
        description='I coded this',
        roleArn="arn:aws:iam::975050037323:role/S3Access",
        dataPrivacy={
            'childDirected': False
        },
        idleSessionTTLInSeconds=123
    )
    botID = response2["botId"]
    newLambda = lambda client: client.list_bots()["botSummaries"][0]["botStatus"]

    print("Creating bot...")
    delayTill("Creating",client,newLambda)
    time.sleep(1)#prevents glitch
    print(newLambda(client))

    newLambda = lambda client: client.list_bot_locales(botId = botID, botVersion = "DRAFT")["botLocaleSummaries"][0]["botLocaleStatus"]
    client.create_bot_locale(
        botId=botID,
        botVersion='DRAFT',
        localeId="en_US",
        description='this is the locale',
        nluIntentConfidenceThreshold=.5,
    )

    delayTill("Creating",client,newLambda)
    time.sleep(1)

    newLambda = lambda client: len(client.list_intents(botId = botID, botVersion = "DRAFT",localeId="en_US")["intentSummaries"]) - 1
    for i in range(len(questions)):
        intentResp = client.create_intent(botId=botID,botVersion="DRAFT",localeId = "en_US",intentName=intentToName(questions[i],i),
        description= "This is a question",sampleUtterances=getSampleUtteranes(questions[i],utters[i]),
        intentClosingSetting={"active" : True, "closingResponse" : {"allowInterrupt": False, "messageGroups":[
            {"message": {"customPayload": { "value": answers[i]}}}]}})

    intentIds.append(intentResp["intentId"])#in case we need intentn ID's

    print("Creating intents")
    delayTillEqual(len(questions),client,newLambda)
    time.sleep(1)

    client.build_bot_locale(
        botId=botID,
        botVersion="DRAFT",
        localeId="en_US"
    )

    print("Building bot...")
    newLambda = lambda client: client.describe_bot_locale(botId=botID,botVersion='DRAFT',localeId="en_US")["botLocaleStatus"]
    delayTill("Building",client,newLambda)
    print("Done")
    return botID


def DeleteBot(botIdName):
    session = boto3.Session(
        aws_access_key_id = key_id,
        aws_secret_access_key = secret_key
    )
    client = session.client('lexv2-models',region_name='us-east-1')
    prevBotsNum = len(client.list_bots()["botSummaries"])
    client.delete_bot(botId=botIdName)
    newLambda = lambda client: len(client.list_bots()["botSummaries"])
    delayTill(prevBotsNum,client,newLambda)
    