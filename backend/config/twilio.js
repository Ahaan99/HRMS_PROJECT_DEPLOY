import twilio from "twilio";
import {ENV} from "./env.js"


const client = twilio(
  ENV.TWILIO_SID,
  ENV.TWILIO_AUTH
);

export default client;