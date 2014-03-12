var maxui_url = 'http://localhost:8081/maxui-dev/index.html'

module.exports = {
'Widget loaded': function (test) {
  test
    .open(maxui_url)
    .assert.exists('#maxui-container', 'The maxui container exists')
    .done();
},
};
