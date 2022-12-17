const express = require("express");
const app = express();
const port = process.env.PORT;
const appConfig = require("./app.config");
const mongoose = require("mongoose");
const { Kafka } = require("kafkajs");
const kafka = new Kafka(appConfig.kafkaOptions);

// -----

app.use(express.json());
app.get("/", (req, res) => res.status(200).send("API 1 ready"));

// -----

const areDatabasesAvailable = async () => {
  mongoose.connect(appConfig.dbUrl).then((con) => {
    console.log("DB connection successful");
  });

  const User = new mongoose.model("user", {
    name: String,
    email: String,
    password: String,
  });

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

  // ! Consuming
  const onUserSignUpMessageReceived = async ({ message, topic, partition }) => {
    console.log("[STEP 3] Message received from Service 2 to Service 1:", {
      partition,
      topic,
      messageKey: message.key.toString(),
      messageValue: message.value.toString(),
    });

    const item = JSON.parse(message.value);
    console.log("[STEP 4] Registering user in mongoDb as well", item);
    const user = await new User(item);
    await user.save();

    // // And sends back another message to communicate the successful registration
    // // ! Publishing / Producing
    // console.log("[STEP 5] Communicating back that was a success");
    // await producer.send({
    //   topic: appConfig.mq.topicSuccess,
    //   messages: [
    //     {
    //       key: "registered_user__success",
    //       value:
    //         "The signup in MongoDB was successful for the user with email: " +
    //         item.email,
    //     },
    //   ],
    // });
    // return;
  };
  await consumer.subscribe({
    // autoCommit: false,
    topic: appConfig.mq.topic,
    fromBeginning: true,
  });
  await consumer.run({
    eachMessage: (props) => onUserSignUpMessageReceived(props),
  });
};

setTimeout(areDatabasesAvailable, 10000);

// -------
app.listen(port, () => {
  console.log("Server 1 it's UP and running");
});
