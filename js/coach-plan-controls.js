function cplanSetView(v) {
  _cplanView = v;
  renderCoachPlan();
}

function cplanToggleDay(i) {
  _cplanExpandDay = _cplanExpandDay === i ? -1 : i;
  renderCoachPlan();
}
