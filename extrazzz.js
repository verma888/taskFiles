var response = {
  msisdn,
  status : "true",
  trasaction_id : "0011",
  response_code : "0",
  time : new Date().getTime()
}


Request = `SET:ZTEHLRSUB:MSISDN,${msisdn}:OBO,1:OBI,1:TS21,0:TS22,0:NAM,1;\n`;
Response = 0;

Request2 = `SET:AIRTELSUB:NODELIST,ECMS:OPTYPE,TEMPBLOCK:SubscriberNumber,${msisdn}:TempBlockingStatus,SET;\n`
REsponse = 0