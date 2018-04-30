function generateRandomId(n, except) {
  let rand;
  do {
    rand = Math.random().toString(36).substr(2);
    while (rand.length < n) {
      rand += Math.random().toString(36).substr(2);
    }
  } while (except.includes(rand))
  return rand;
}

function showErr(err) {
  console.log(err);
}

module.exports = {
  generateRandomId: generateRandomId,
  showErr: showErr
}