'use strict';
const _ = require('lodash');
const config = require('@config');
const mqtt = require('mqtt');

const mqttConfig = config.get('index.mqtt');

let client = undefined;
let isConnected = false;

exports.connect = async function () {
  if (!_.isUndefined(client)) return;
  const { url, username, password } = mqttConfig;
  client = mqtt.connect(url, { username, password });

  client.on('connect', function () {
    console.log('MQTT Connected');
    isConnected = true;
  });

  client.on('close', function () {
    isConnected = false;
  });

  client.on('disconnect', function () {
    console.log('MQTT Disconnected');
    isConnected = false;
  });

  client.on('offline', function () {
    isConnected = false;
  });

  client.on('error', function (error) {
    console.log('MQTT Error', error.message);
    isConnected = false;
  });
};

exports.publish = (topic, msg) => {
  if (!isConnected) return false;
  client.publish(topic, msg);
  return true;
};

exports.getClient = () => {
  return client;
};

exports.isConnected = isConnected;
