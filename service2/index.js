const express = require("express");
const app = express();
const port = process.env.PORT;
const appConfig = require("./app.config");
const sequelize = require("sequelize");
const { Kafka } = require("kafkajs");
const kafka = new Kafka(appConfig.kafkaOptions);

// -----

app.use(express.json());
app.get("/", (req, res) => res.status(200).send("API 2 ready"));

// -----

const areDatabasesAvailable = async () => {
  const db = new sequelize(appConfig.dbUrl, {
    dialect: "postgres",
  });
  const User = db.define("user", {
    name: sequelize.STRING,
    email: sequelize.STRING,
    password: sequelize.STRING,
  });

  db.sync({ force: true }); // DROPS table before creating it

  // TWO-WAYS MESSAGE QUEUEING
  const producer = await kafka.producer();
  const consumer = await kafka.consumer({
    groupId: appConfig.mq.groupId,
  });

  // producer.on("producer.connect", () => {
  //   console.log(`KafkaProvider: connected`);
  // });
  // producer.on("producer.disconnect", () => {
  //   console.log(`KafkaProvider: could not connect`);
  // });
  // producer.on("producer.network.request_timeout", (payload) => {
  //   console.log(`KafkaProvider: request timeout ${payload.clientId}`);
  // });

  await producer.connect();
  await consumer.connect();

  // // ! Consuming
  // const onUserSignUpSuccessMessageReceived = async ({
  //   message,
  //   topic,
  //   partition,
  // }) => {
  //   console.log(
  //     "[STEP 6] Sign-up Success received from Service 1 to Service 2:",
  //     {
  //       partition,
  //       topic,
  //       messageKey: message.key.toString(),
  //       messageValue: message.value.toString(),
  //     }
  //   );
  // };
  // await consumer.subscribe({
  //   // autoCommit: false,
  //   topic: appConfig.mq.topicSuccess,
  //   fromBeginning: true,
  // });
  // await consumer.run({
  //   eachMessage: (props) => onUserSignUpSuccessMessageReceived(props),
  // });

  const postHandler = async (req, res) => {
    console.log("[STEP 1] creating user in Postgresql:", req.body);
    const item = await User.create(req.body);

    console.log("[STEP 2] sending message from Service 2 to Service 1");
    // ! Publishing / Producing before return
    await producer.send({
      topic: appConfig.mq.topic,
      messages: [
        {
          key: "registered_user",
          value: JSON.stringify(req.body),
        },
      ],
    });

    return res.status(200).send(item);
  };
  app.post("/", postHandler);
};

setTimeout(areDatabasesAvailable, 10000);

// -------
app.listen(port, () => {
  console.log("Server 2 it's UP and running");
});
