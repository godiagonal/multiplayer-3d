module.exports = function Message(text, sender) {
    this.date = Date.now();
    this.text = text;
    this.sender = sender;
}