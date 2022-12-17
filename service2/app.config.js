module.exports = {
  kafkaHost: process.env.KAFKA_BOOTSTRAP_SERVERS,
  kafkaOptions: {
    clientId: "test-client",
    brokers: ["kafka:9092"],
    ssl: false,
    logLevel: 2,
    // sasl: {
    //   mechanism: "plain",
    //   username: "xxxxxxzabcxxxxx",
    //   password: "xxxxxabczxxxxx",
    // },
  },
  mq: {
    groupId: "test-group",
    topic: process.env.KAFKA_TOPIC,
    topicSuccess: process.env.KAFKA_TOPIC_SUCCESS,
  },
  dbUrl: process.env.POSTGRES_URL,
  port: process.env.PORT,
};
