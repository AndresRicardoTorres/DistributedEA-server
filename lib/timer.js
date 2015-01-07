function Timer() {
  this.total   = 0;
  this.initial = 0;
  this.end     = 0;
}

Timer.prototype.restart = function () {
  this.total   = 0;
  this.initial = new Date();
};

Timer.prototype.start = function () {
  this.initial = new Date();
};

Timer.prototype.stop = function () {
  this.end    = new Date();
  this.total += this.end - this.initial;
};

// return the time in seconds
Timer.prototype.getTime = function () {
  return this.total / 1000;
};

// return the date initial
Timer.prototype.getInitialDate = function () {
  return this.initial;
};

// return the LAST date end
Timer.prototype.getEndDate = function () {
  return this.end;
};

module.exports = Timer;
