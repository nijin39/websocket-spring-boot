const AWS = require("aws-sdk");

const api = new AWS.ApiGatewayManagementApi({
  endpoint: `${process.env.WS_API_ID}.execute-api.ap-northeast-2.amazonaws.com/dev/`,
});

const options = ["Yes", "No", "Maybe", "Probably", "Probably Not"];

exports.handler = async (event) => {
  console.log("MESSSSSSAGE ::::::", JSON.stringify(event));

  const route = event.requestContext.routeKey;
  const connectionId = event.requestContext.connectionId;

  switch (route) {
    case "$connect":
      console.log("Connection occurred");
      break;
    case "$disconnect":
      console.log("Disconnection occurred");
      break;
    case "$default":
      console.log("Disconnection occurred");
      break;
    case "sendmessage":
      console.log("Received message:", event.requestContext.body);
      await replyToMessage(
        options[Math.floor(Math.random() * options.length)],
        connectionId
      );
      break;
    default:
      console.log("Received unknown route:", route);
  }

  return {
    statusCode: 200,
  };
};

async function replyToMessage(response, connectionId) {
  const data = { message: response };
  const params = {
    ConnectionId: connectionId,
    Data: Buffer.from(JSON.stringify(data)),
  };

  return api.postToConnection(params).promise();
}
