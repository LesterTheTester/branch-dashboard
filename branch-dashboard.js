Router.configure({
  debug: true,
  before: function() {
    console.log('before all')
  }
});

Branches = new Meteor.Collection('branches');

Router.map(function() {
  this.route('home', {
    path: '/', 
    onRun: function() {
      console.log('load one')
    },
    onBeforeAction: function() {
      console.log('before one')
    }
  });
  this.route('branch', {
    where: 'server',
    path: '/api/branch/:branchName',
    action: function() {
      var request = this.request;
      var response = this.response;
      var requestData = this.request.body;

      var branchName = this.params.branchName;

      response.writeHead(200, {'Content-Type': 'text/html'});

      Branches.upsert({branchName: branchName}, {$set: {branchName: branchName, branchStatus:this.request.body}});

      response.end('BRANCH');
      console.log('final', branch)
    }
  });
})


if (Meteor.isClient) {

  Template.branches.branches = function () {
    return Branches.find({});
  };

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
