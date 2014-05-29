Router.configure({
  before: function() {
    //console.log('Before All')
  }
});

function Branch() {
  // Everything prefixed with 'r_' denotes
  // some branch property that had values
  // which follows the pattern of:
  // ''  => unknown
  // '0' => bad
  // '1' => good

  // These are pre-set branch attributes
  // which must be good for the BranchStatus
  // to be 'ready'
  this.r_built_linux_x64 = '';
  this.r_built_linux_i386 = '';
  this.r_built_linux_x64_glibc23 = '';
  this.r_built_linux_x86_glibc23 = '';
  this.r_built_arm = '';
  this.r_built_synology_213 = '';
  this.r_built_ppc = '';
  this.r_built_freebsd = '';
  this.r_built_freebsd32 = '';
  this.r_passed_unittests = '';
  this.r_mergeable = '';
  // Concatonated Title Case to denote that
  // this is derived information
  this.BranchStatus = function() {
    // TODO: Refactor this functionality to set a value
    // on the model and only do this calculation if the
    // attributes this value depends on have changed

    // Right now BranchStatus is only called once per branch so it's
    // kinda sorta acceptable.

    var checkedAttributes = _.filter(this, function(value, key) {
      // We're checking for all attributes beginning with 'r_'
      // to allow for checking of branch attributes that aren't
      // defined in ths Branch object
      return key.substring(0, 2) == "r_";
    });

    var goodShit = [];
    _.each(this, function(value, key) {
      if (key.substring(0, 2) == "r_" && _.isString(value) && value === "1") {
        goodShit.push(key);
      }
    });

    var badShit = [];
    _.each(this, function(value, key) {
      if (key.substring(0, 2) == "r_" && _.isString(value) && value === "0") {
        badShit.push(key);
      }
    });
    
    if (goodShit.length == checkedAttributes.length) {
      return 'ready';
    } else if (badShit.length > 0) {
      return 'broken';
    } else {
      return 'unknown';
    }
  };
}

Branches = new Meteor.Collection('branches', {
  transform: function(branch) {
    var newBranch = new Branch();
    var mergedBranch = _.extend(newBranch, branch);

    // these are not 'mergable' branches
    if (_.indexOf(['master', 'develop'], mergedBranch.branchName) != -1) {
      delete mergedBranch.r_mergeable;
    }

    return mergedBranch;
  }
});


Router.map(function() {
  this.route('home', {
    path: '/', 
    onRun: function() {
      //console.log('load one')
    },
    onBeforeAction: function() {
      //console.log('before one')
    }
  });
  this.route('branchAPI', {
    where: 'server',
    path: '/api/branch/:branchName',
    action: function() {
      var request = this.request;
      var response = this.response;
      var requestData = this.request.body;

      var branchName = this.params.branchName;

      response.writeHead(200, {'Content-Type': 'text/html'});

      Branches.upsert({branchName: branchName}, {$set: requestData});

      response.end('updated:' + branchName);
    }
  });
})

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
  
  Branches.find({}).observe({
    added: function(newBranch) {
      //console.log('added', newBranch);
    },
    changed: function(updatedBranch, oldBranch) {
      //console.log('changed', updatedBranch);
      //Branches.findOne({_id: id}).setBranchStatus;
    }
  });
}

if (Meteor.isClient) {

  Template.branch.helpers({
    successes: function() {
      var branch = this;
      var goodShit = [];
      _.each(branch, function(value, key) {
        if (key.substring(0, 2) == "r_" && _.isString(value) && value === "1") {
          goodShit.push(key.substring(2));
        }
      });
      return goodShit.sort();
    },
    unknowns: function() {
      var branch = this;
      var unknownShit = [];
      _.each(branch, function(value, key) {
        if (key.substring(0, 2) == "r_" && _.isString(value) && value.length == 0) {
          unknownShit.push(key.substring(2));
        }
      });
      return unknownShit.sort();

    },
    failures: function() {
      var branch = this;
      var badShit = [];
      _.each(branch, function(value, key) {
        if (key.substring(0, 2) == "r_" && _.isString(value) && value === "0") {
          badShit.push(key.substring(2));
        }
      });
      return badShit.sort();
    } 
  });

  Template.branches.allBranches = function () {
    return Branches.find({});
  };
  
  Template.branches.master = function () {
    return Branches.findOne({branchName: 'master'});
  };
  
  Template.branches.develop = function () {
    return Branches.findOne({branchName: 'develop'});
  };

  Template.branches.features = function () {
    return Branches.find({branchName: /^feature/});
  };

  Template.branches.hotfixes = function () {
    return Branches.find({branchName: /^hotfix/});
  };

  Template.branches.releases = function () {
    return Branches.find({branchName: /^release/});
  };

  Template.branches.bugfixes = function () {
    return Branches.find({branchName: /^bugfix/});
  };
}

