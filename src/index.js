import Blockly from "node-blockly/browser";
import downloadjs from "downloadjs";
import $ from "jquery";
import jui from "jquery-ui";
import "blueimp-file-upload";

const start = document.getElementById("startBlocks");
const blockEditor = document.getElementById("editor");
const toolbox = document.getElementById("toolbox");
const outputText = document.getElementById("output");

const eventVars = {
  message: [
    ["message", "message.content"],
    ["length", "message.content.length"],
    ["username", "message.author.username"],
    ["mention", "message.author"],
    ["channel", "message.channel"],
    ["channelid", "message.channel.id"]
  ],
  ready: [["NONE", "NONE"]],
  guildMemberAdd: [
    ["member", "member.user"],
    ["username", "member.user.username"],
    ["tag", "member.user.tag"],
    ["membercount", "member.guild.members.size"]
  ]
};

Blockly.Blocks["client_on_event"] = {
  init() {
    const events = [];
    for (let key of Object.keys(eventVars)) {
      events.push([key, key]);
    }
    this.setPreviousStatement(true, "Action");
    this.setNextStatement(true, "Action");
    this.appendDummyInput()
      .appendField("on ")
      .appendField(new Blockly.FieldDropdown(events), "eventName");
    this.appendStatementInput("DO").appendField();
    this.setColour(230);
  }
};

Blockly.JavaScript["client_on_event"] = block => {
  const eventName = block.getFieldValue("eventName");
  const memberCode = Blockly.JavaScript.statementToCode(block, "DO");
  const args = eventVars[eventName].map(e => e[0]).join(", ");
  const addArgs = args != "NONE" ? args : "";

  return [
    `client.on("${eventName}",async (${addArgs}) => {`,
    memberCode,
    `});\n`
  ].join("\n");
};

function parentUntilEvent(block) {
  if (block.getParent()) {
    if (block.getParent().type == "client_on_event") return block.getParent();
    return parentUntilEvent(block.getParent());
    // return block;
  }
  if (block.type === "client_on_event") return block;
  return false;
}

Blockly.Blocks["event_var"] = {
  init() {
    this.setOutput(true, "String");

    this.setInputsInline(true);
    this.appendDummyInput().appendField("event var");
    // if (this.getRootBlock().type == "client_on_event") {
    //   const newOptions =
    //     eventVars[this.getRootBlock().getFieldValue("eventName")];
    //   this.appendDummyInput("dropdown").appendField(
    //     new Blockly.FieldDropdown(newOptions),
    //     "variable"
    //   );
    // }

    this.setColour(230);
  },
  onchange() {
    const dropInput = this.getInput("dropdown");
    let dropdown = false;
    let currentOptions = false;
    const parentEvent = parentUntilEvent(this);
    if (dropInput) {
      dropdown = dropInput.fieldRow[0];
      currentOptions = dropdown.menuGenerator_;
      if (!parentEvent) {
        this.removeInput("dropdown");
        return;
      }
    } else {
      if (!parentEvent) return;
      const newOptions = eventVars[parentEvent.getFieldValue("eventName")];
      this.appendDummyInput("dropdown").appendField(
        new Blockly.FieldDropdown(newOptions),
        "variable"
      );
    }
  }
};

Blockly.JavaScript["event_var"] = block => {
  const variable = block.getFieldValue("variable");
  return [`${variable}`, Blockly.JavaScript.ORDER_NONE || "'"];
};

Blockly.Blocks["message_reply"] = {
  init() {
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.appendDummyInput().appendField("reply");
    this.appendValueInput("sendBox");
    this.setColour(230);
  }
};

Blockly.JavaScript["message_reply"] = block => {
  if (block.getRootBlock().type != "client_on_event") return "";
  if (block.getRootBlock().getFieldValue("eventName") != "message") return "";
  let message = Blockly.JavaScript.valueToCode(
    block,
    "sendBox",
    Blockly.JavaScript.ORDER_NONE || "''"
  );
  if (message.length == 0) return "";
  return `message.channel.send(${message});\n`;
};

Blockly.Blocks["wait_time"] = {
  init() {
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.appendDummyInput().appendField("wait");
    this.appendValueInput("waitTime").setCheck("Number");
    this.appendDummyInput().appendField("ms");
    this.setColour(290);
  }
};

Blockly.JavaScript["wait_time"] = block => {
  if (block.getRootBlock().type != "client_on_event") return "";
  let waitTime = parseInt(
    Blockly.JavaScript.valueToCode(
      block,
      "waitTime",
      Blockly.JavaScript.ORDER_ATOMIC || 0
    )
  );
  if (isNaN(waitTime)) return "";
  if (waitTime <= 0) return "";
  return `await new Promise(res => setTimeout(res,${waitTime}))\n`;
};

Blockly.Blocks["util_timeout"] = {
  init() {
    const events = [];
    for (let key of Object.keys(eventVars)) {
      events.push([key, key]);
    }
    this.setPreviousStatement(true, "Action");
    this.setNextStatement(true, "Action");
    this.setInputsInline(true);
    this.appendDummyInput().appendField("timeout");
    this.appendValueInput("waitTime").setCheck("Number");
    this.appendStatementInput("DO").appendField();
    this.setColour(290);
  }
};

Blockly.JavaScript["util_timeout"] = block => {
  let waitTime = parseInt(
    Blockly.JavaScript.valueToCode(
      block,
      "waitTime",
      Blockly.JavaScript.ORDER_ATOMIC || 0
    )
  );
  if (isNaN(waitTime)) return "";
  if (waitTime <= 0) return "";

  const memberCode = Blockly.JavaScript.statementToCode(block, "DO");

  return [`setTimeout(async () => {`, memberCode, `},${waitTime});\n`].join(
    "\n"
  );
};

Blockly.Blocks["util_interval"] = {
  init() {
    const events = [];
    for (let key of Object.keys(eventVars)) {
      events.push([key, key]);
    }
    this.setPreviousStatement(true, "Action");
    this.setNextStatement(true, "Action");
    this.setInputsInline(true);
    this.appendDummyInput().appendField("interval");
    this.appendValueInput("waitTime").setCheck("Number");
    this.appendStatementInput("DO").appendField();
    this.setColour(290);
  }
};

Blockly.JavaScript["util_interval"] = block => {
  let waitTime = parseInt(
    Blockly.JavaScript.valueToCode(
      block,
      "waitTime",
      Blockly.JavaScript.ORDER_ATOMIC || 0
    )
  );
  if (isNaN(waitTime)) return "";
  if (waitTime <= 0) return "";

  const memberCode = Blockly.JavaScript.statementToCode(block, "DO");

  return [`setInterval(async () => {`, memberCode, `},${waitTime});\n`].join(
    "\n"
  );
};

Blockly.Blocks["message_send"] = {
  init() {
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.appendDummyInput().appendField("send");
    this.appendValueInput("sendBox");
    this.appendDummyInput().appendField("to");
    this.appendValueInput("channelBox");
    this.setColour(230);
  }
};

Blockly.JavaScript["message_send"] = block => {
  if (block.getRootBlock().type != "client_on_event") return "";
  let message = Blockly.JavaScript.valueToCode(
    block,
    "sendBox",
    Blockly.JavaScript.ORDER_NONE || "''"
  );
  let channel = Blockly.JavaScript.valueToCode(
    block,
    "channelBox",
    Blockly.JavaScript.ORDER_NONE || "''"
  );
  if (message.length == 0) return "";
  const event = block.getRootBlock().getFieldValue("eventName");
  const locations = {
    ready: "client",
    message: "message.guild",
    guildMemberAdd: "member.guild"
  };
  return `${
    locations[event]
  }.channels.find(c => c.id == ${channel} || c.name == ${channel}).send(${message});\n`;
};

Blockly.Blocks["client_activity"] = {
  init() {
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.appendDummyInput().appendField("set status to");
    this.appendValueInput("message");
    this.appendDummyInput()
      .appendField("with activity")
      .appendField(
        new Blockly.FieldDropdown([
          ["playing", "PLAYING"],
          ["watching", "WATCHING"],
          ["listening", "LISTENING"]
        ]),
        "activity"
      );
    this.setColour(230);
  }
};

Blockly.JavaScript["client_activity"] = block => {
  let prepend = "";
  if (
    ["client_on_event", "util_interval", "util_timeout"].includes(
      block.getRootBlock().type
    )
  )
    prepend = "await ";
  let message = Blockly.JavaScript.valueToCode(
    block,
    "message",
    Blockly.JavaScript.ORDER_NONE || "''"
  );
  let activity = block.getFieldValue("activity");
  return `${prepend}client.user.setActivity(${message},{type: "${activity}"});\n`;
};

Blockly.Blocks["client_variables"] = {
  init() {
    this.setOutput(true, "String");
    this.appendDummyInput()
      .appendField("client")
      .appendField(
        new Blockly.FieldDropdown([
          ["username", "user.username"],
          ["tag", "user.tag"],
          ["discriminator", "user.discriminator"],
          ["guildcount", "guilds.size"],
          ["usercount", "users.size"]
        ]),
        "variable"
      );

    this.setColour(230);
  }
};

Blockly.JavaScript["client_variables"] = block => {
  const variable = block.getFieldValue("variable");
  return [`client.${variable}`, Blockly.JavaScript.ORDER_NONE || "'"];
};

Blockly.Blocks["client_login"] = {
  init() {
    this.setPreviousStatement(true, "Action");
    this.appendValueInput("token").appendField("login");
    this.setColour(230);
  }
};

Blockly.JavaScript["client_login"] = block => {
  const token = Blockly.JavaScript.valueToCode(
    block,
    "token",
    Blockly.JavaScript.ORDER_NONE || "''"
  );
  return `client.login(${token});\n`;
};

Blockly.JavaScript["text_print"] = block => {
  const text = Blockly.JavaScript.valueToCode(
    block,
    "TEXT",
    Blockly.JavaScript.ORDER_NONE || "''"
  );
  return `console.log(${text});\n`;
};

const editor = Blockly.inject(blockEditor, {
  toolbox: toolbox,
  grid: { spacing: 25, length: 3, colour: "#ccc", snap: true }
});

$("#fileDrop").fileupload({
  url: "/getfile",

  done(e, data) {
    editor.clear();
    const xml = Blockly.Xml.textToDom(data.result);
    Blockly.Xml.domToWorkspace(xml, editor);
    const blocks = editor.getBlocksByType("event_var");
    function finishLoading(event) {
      if (event.type == Blockly.Events.FINISHED_LOADING) {
        editor.removeChangeListener(finishLoading);
        for (let block of blocks) {
          const text = $(xml)
            .find(`[id="${block.id}"]`)
            .find("field")
            .text();
          block.setFieldValue(text, "variable");
        }
      }
    }
    editor.addChangeListener(finishLoading);
  }
});

let toSend = "";
document.onkeydown = e => {
  if (e.ctrlKey) {
    if (e.key == "s") {
      fetch("/update", {
        method: "POST",
        body: toSend,
        headers: {
          "Content-Type": "text/plain"
        }
      });
      e.preventDefault();
    } else if (e.key == "x") {
      downloadjs(
        Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(editor)),
        "export.dcb"
      );
    }
  }
};

editor.addChangeListener(() => {
  const output = [
    "const Discord = require('discord.js');",
    "const client = new Discord.Client();",
    Blockly.JavaScript.workspaceToCode(editor)
  ].join("\n");
  outputText.innerHTML = output;
  toSend = output;
});
