#!/usr/bin/env node

var Jstest = require('./jstest'),
Util = require('../lib/utils'),
Wrapper = require('../lib/wrapper'),
Model = require('../lib/model')

/* --------------- TEST ROUTINES ------------------- */
const DB1 = "d1",
DB2 = "d2"
root.Config = {database: {name: 'test'}}

const TEST_PERSON1 = "Person 1", 
TEST_PERSON2 = "Person 2", 
TEST_PERSON3 = "Person 3", 
TEST_PERSON4 = "Person 4",
TEST_PERSON5 = "Person 5",
TEST_PERSON6 = "Person 6",
TEST_PERSON7 = "Person 7",
TEST_PERSON8 = "Person 8"
TEST_PERSON9 = "Person 9"

const TEST_LASTNAME1 = "Lastname 1", 
TEST_LASTNAME2 = "Lastname 2", 
TEST_LASTNAME3 = "Lastname 3", 
TEST_LASTNAME4 = "Lastname 4",
TEST_LASTNAME5 = "Lastname 5",
TEST_LASTNAME6 = "Lastname 6",
TEST_LASTNAME7 = "Lastname 7",
TEST_LASTNAME8 = "Lastname 8"

const TEST_TITLE1 = "Title 1",
TEST_TITLE2 = "Title 2",
TEST_TITLE3 = "Title 3",
TEST_TITLE4 = "Title 4",
TEST_TITLE5 = "Title 5",
TEST_TITLE6 = "Title 6",
TEST_TITLE7 = "Title 7",
TEST_TITLE8 = "Title 8"
TEST_TITLE9 = "Title 9"

var Tests = function() {
	Jstest.call(this)
}
Util.inherits(Tests, Jstest)

Tests.prototype.init = function() {
	Jstest.prototype.init.call(this)
	var obj1 = new Object
	var obj2 = new Object
	obj1.find = function() {
		//console.log('FIND: query %s'.format(JSON.stringify(arguments[0])))
		return this.__chain_find.apply(this,arguments)
	}

	this.db1 = Wrapper(Model.Table(DB1), obj1)
	this.db2 = Wrapper(Model.Table(DB2), obj2)

	this.db1.remove({})
	this.db1.save({name: TEST_PERSON1, ident:1})
	this.db1.save({name: TEST_PERSON2, ident:1})
	this.db1.save({name: TEST_PERSON3, ident:1})
	this.db1.save({name: TEST_PERSON4, ident:1})

	this.db2.remove({})
	this.db2.save({title: TEST_TITLE1})
	this.db2.save({title: TEST_TITLE2})
	this.db2.save({title: TEST_TITLE3})
	this.db2.save({title: TEST_TITLE4})

//	for (var i=1800; i<1802; i++) {
//		this.db2.save({title: "Title %s".format(i)})
//	}
//	this.next()
}

/* ------- Test set 'testinit' - initialize DB for test cases  --------- */

Tests.prototype.testinit1 = function() {
	var self = this
	this.db1.find({name: TEST_PERSON1}, function(reply) {
		if (reply.numberReturned > 0) {
			var person = reply.documents[0]
			self.db2.find({title: TEST_TITLE1}, function(reply2) {
				if (reply2.numberReturned > 0) {
					var job = reply2.documents[0]
					person._id_d2 = job._id
					self.db1.update({_id: person._id}, person, 1)
					self.next()
				} else {
					throw "Cannot find " + TEST_TITLE1 + " in table " + DB2
				}
			})
		} else {
			throw "Cannot find " + TEST_PERSON1 + " in table " + DB1
		}
	})
}

Tests.prototype.testinit2 = function() {
	var self = this
	self.db1.find({name: TEST_PERSON3}, function(reply) {
		if (reply.numberReturned > 0) {
			var person = reply.documents[0]
			self.db2.find({title: TEST_TITLE3}, function(reply2) {
				if (reply2.numberReturned > 0) {
					var job = reply2.documents[0]
					self.job1 = job
					person._id_d2_job = job._id
					self.db1.update({_id: person._id}, person, 1)
					self.next()
				} else {
					throw "Cannot find " + TEST_TITLE3 + " in table " + DB2
				}
			})
		} else {
			throw "Cannot find " + TEST_PERSON3 + " in table " + DB1
		}
	})
}

Tests.prototype.testinit3 = function() {
	var self = this
	self.db1.find({name: TEST_PERSON4}, function(reply) {
		if (reply.numberReturned > 0) {
			var person = reply.documents[0]
			self.job1._id_d1_ceo = person._id
			self.db2.update({_id: self.job1._id}, self.job1, 1)
			//Model.Cleanup()
			self.next()
		} else {
			throw "Cannot find " + TEST_PERSON4 + " in table " + DB1
		}
	})
}

/* ------- Test set 'testget' - test various GET cases   --------- */

// Access db field in ready state
Tests.prototype.testget1 =  function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON2)
		.on('ready', function(person2) {
			self.assertEquals('test1', person2.name, TEST_PERSON2, 'person2.name')
			self.next()
		}).on('error', function(msg) {
			console.log('! EXC test1 : ' + msg)
			self.next()
		})
}

// Access db related field in loading state
Tests.prototype.testget2 =  function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON1).d2
		.on('ready', function(job) {
			self.assertEquals('test2', job.title, TEST_TITLE1, 'job.title', '')
			self.next()
		}).on('error', function(msg){
			console.log("! EXC test2: " + msg)
			self.next()
		})
}

// Access db related field in ready state
Tests.prototype.testget3 =  function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON1)
		.on('ready', function(person) {
			person.d2
				.on('ready', function(job) {
					self.assertEquals('test3', job.title, TEST_TITLE1, 'job.title', '')
					self.next()
				})
		}).on('error', function(msg){
			console.log("! EXC test3: " + msg)
			self.next()
		})
}

// Access related fields via complex key
Tests.prototype.testget4 =  function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON3).job
		.on('ready', function(job) {
			self.assertEquals('test4', job.title, TEST_TITLE3, 'job.title', '')
			self.next()
		}).on('error', function(msg){
			console.log("! EXC test4: " + msg)
			self.next()
		})
}

// ... in ready state
Tests.prototype.testget5 =  function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON3)
		.on('ready', function(person) {
			person.job
				.on('ready', function(job) {
					self.assertEquals('test5', job.title, TEST_TITLE3, 'job.title', '')
					self.next()
				})
		}).on('error', function(msg){
			console.log("! EXC test5: " + msg)
			self.next()
		})
}

// Access db related field in loading state via 2-step indirection
Tests.prototype.testget6 =  function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON3).job.ceo
		.on('ready', function(ceo) {
			self.assertEquals('test6', ceo.name, TEST_PERSON4, 'ceo.name', '')
			self.next()
		}).on('error', function(msg){
			console.log("! EXC test6: " + msg)
			self.next()
		})
}

// ... in ready state
Tests.prototype.testget7 =  function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON3)
		.on('ready', function(person) {
			person.job.ceo
				.on('ready', function(ceo) {
					self.assertEquals('test7', ceo.name, TEST_PERSON4, 'ceo.name', '')
					self.assertEquals('test7', ceo._parent.title, TEST_TITLE3, 'ceo._parent.title', '')
					self.assertEquals('test7', ceo._parent._parent.name, TEST_PERSON3, 'ceo._parent._parent.name', '')
					self.next()
				})
		}).on('error', function(msg){
			console.log("! EXC test7: " + msg)
			self.next()
		})
}

// Read a deferred field from a entry in loading state
Tests.prototype.testget8 =  function() {
	var self = this
	var person = Model.dbmodel(DB1).byName(TEST_PERSON1)
	person.name.onReady(function (name) {
		self.assertEquals('test8', name, TEST_PERSON1, 'name')
		self.next()
	})
}

// Read a field from a entry in laoding state  - 2 steps
Tests.prototype.testget9 =  function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON1).d2.title
		.onReady(function (title) {
			self.assertEquals('test9', title, TEST_TITLE1, 'title')
			self.next()
		})
}

// Handle nonexistant fields
Tests.prototype.testget10 =  function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON1).xyz
		.onReady(function (title) {
			self.assertFail('testget10', 'Field xyz is non-existant, onReady not to be called')
		}).onError(function(msg) {
			self.assertPass('testget10', 'onError called for non-existant field')
			self.next()
		})
}

// Handle multilevel nonexistant fields
Tests.prototype.testget11 =  function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON1).xyz.abc.def
		.onReady(function (title) {
			self.assertFail('testget11', 'Field xyz.abc.def is non-existant, onReady not to be called')
		}).onError(function(msg) {
			self.assertPass('testget11', 'onError called for non-existant multilevel field')
			self.next()
		})
}

// Handle 2-level nonexistant fields
Tests.prototype.testget12 =  function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON1).xyz.abc
		.onReady(function (title) {
			self.assertFail('testget12', 'Field xyz.abc is non-existant, onReady not to be called')
		}).onError(function(msg) {
			self.assertPass('testget12', 'onError called for non-existant 2-level field')
			self.next()
		})
}

// Unhandled onready
Tests.prototype.testget13 =  function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON1)
		.on('error', function(user) {
			self.assertFail('testget13.error', "Error handler should NOT be invoked") })
		.onUnhandled(function(evt, args) {
			self.assertEquals('testget13.event', evt, 'ready')
			self.assertEquals('testget13', args[0].name, TEST_PERSON1)
			self.next()
		})
}

Tests.prototype.testget14 =  function() {
	var self = this
	var unhandledCalled = false
	Model.dbmodel(DB1).byName(TEST_PERSON1)
		.on('ready', function(user) {
			self.assertEquals('testget14', user.name, TEST_PERSON1)
			self.assertEquals('testget14.unhandledcheck', unhandledCalled, false)
			self.next() })
		.onUnhandled(function(uhandled) {
			self.assertFail('testget14', 'unhandled should NOT be called when normal handler is present')
			unhandledCalled = true
		})
}

// Unhandled onerror
Tests.prototype.testget15 =  function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON1).xyz.abc
		.onUnhandled(function(unhandled) {
			self.assertPass('testget15', 'unhandled error invoked')
			self.next()
		})
}

Tests.prototype.testget16 =  function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON1).abc
		.on('error', function(msg) {
			self.assertPass('testget16', 'normal error handled invoked')
			self.next()	})
		.onUnhandled(function(unhandled) {
			self.assertFail('testget16', 'unhandled error should NOT be invoked')
		})
}


/* ------- Test set 'testhelper' - test Model helper   --------- */

Tests.prototype.testhelper1 = function() {
	var self = this
	var Person = Model.helper(DB1, 'name')
	var person = Person(TEST_PERSON1)
		.onSave(function(p) {
			Person(TEST_PERSON1).lastname
				.onReady(function(lastname) {
					self.assertEquals('testhelper1', lastname, TEST_LASTNAME1, 'lastname')
					self.next()
				})
		})
	person.lastname = TEST_LASTNAME1
	person.save()
}

/* ------- Test set 'testadd' - test various SET cases   --------- */

// Enure add event fires upon findadd
Tests.prototype.testadd1 = function() {
	var self = this
	var added = false
	Model.dbmodel(DB1).findadd({name: TEST_PERSON5})
		.onAdd(function(person) {
			added = true
			self.assertEquals('testadd1 onadd', person instanceof Model.PlaceHolder, true, 'person instanceof PlaceHolder')
		}).onReady(function(person5) {
			self.assertEquals('testadd1 onready', added, true, 'added')
			self.assertEquals('testadd1 onready', person5.name, TEST_PERSON5, 'person5.name')
			self.next()
		})
}

// Findadd when entry exists
Tests.prototype.testadd1_1 = function() {
	var self = this
	var added = false
	Model.dbmodel(DB1).findadd({name: TEST_PERSON5}, 'name')
		.onAdd(function(person) {
			added = true
			self.assertFail('testadd1.1', "onAdd should NOT be called")
		}).onSave(function(person5) {
			self.assertEquals('testadd1.1 onSave', added, false, 'added')
			Model.dbmodel(DB1).byName(TEST_PERSON5)
				.onReady(function(person5) {
					self.assertEquals('testadd1.1 onSave', person5.name, TEST_PERSON5, 'person5.name')
					//self.assertEquals('testadd1.1 onSave', person5.ident, 2, 'person5.ident')
					Model.dbmodel(DB1).list({name: TEST_PERSON5}).onReady(function(persons) {
						self.assertEquals('testadd1.1 check', persons.length, 1, 'persons.length')
						self.next()
					})
				})
		})
}

// Enure no add event if entry exists
Tests.prototype.testadd2 = function() {
	var self = this
	var self = this
	var added = false
	Model.dbmodel(DB1).add({name: TEST_PERSON5}, 'name')
		.onAdd(function(person) {
			self.assertFail("testadd2", "onAdd should NOT be called")
		}).onExists(function() {
			self.assertPass("testadd2", "onExists called")
			self.next()
		})
}

// Enure add when no entry exists
Tests.prototype.testadd2_1 = function() {
	var self = this
	var self = this
	var added = false
	var TestPerson = "Person XYZ"
	Model.dbmodel(DB1).add({name: TestPerson}, 'name')
		.onAdd(function(person) {
			self.assertPass("testadd2.1", "onAdd called")
			self.next()
		}).onExists(function(person) {
			self.assertFail("testadd2.1-2", "onExists should NOT be called")
		})
}

// Create new entry - set new field in waiting state
/*
Tests.prototype.testadd3 = function() {
	var self = this
	// verify person6 not present
	Model.dbmodel(DB1).byName(TEST_PERSON6)
		.onReady(function(person) {
			self.assertFail('testadd3-1', "Verify person6 is not in the DB")
		}).onNotfound(function (msg, person) {
			self.assertPass('testadd3-2', "Verify person6 is not in the DB")
			
			// create person6
			var person = Model.dbmodel(DB1)
			person.name = TEST_PERSON6
			person.onSave(function() {
				// verify person6 exists
				Model.dbmodel(DB1).byName(TEST_PERSON6)
					.onReady(function (person6) {
						self.assertEquals('testadd3-3', person6.name, TEST_PERSON6, 'person6.name')
						self.next()
					}).onError(function(msg, person) {
						self.assertFail('testadd3-4', "Verify person6 was added. Error: " + msg)
						self.next()
					})
			})
			.save()
			
		})
}
*/

// Test cached field for added object
Tests.prototype.testadd4 = function() {
	var self = this
	Model.dbmodel(DB1).findadd({name: TEST_PERSON7})
		.onAdd(function(person) {
			self.assertEquals('testadd4', person.name, TEST_PERSON7, 'person.name')
			self.next()
		})
}

// Assigning a loading entry to another loading entry
Tests.prototype.testadd5 = function() {
	var self = this
	var person = Model.dbmodel(DB1).find({name: TEST_PERSON7})
	person.job = Model.dbmodel(DB2).findadd({title: TEST_TITLE7})
	person.save()
		.onSave(function(person) {
			Model.dbmodel(DB1).find({name: TEST_PERSON7}).job
				.onReady(function(job) {
					self.assertEquals('testadd5', job.title, TEST_TITLE7)
					self.assertEquals('testadd5', person.name, TEST_PERSON7)
					self.next()
				})
		})
}

/* ------- Test set 'testset' - test various SET cases   --------- */

// Set new field in ready state
Tests.prototype.testset1 = function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON4)
		.onReady(function(person4) {
			self.assertEquals('testset1', person4.name, TEST_PERSON4, 'person4.name')
			self.assertEquals('testset1', person4.lastname, undefined, 'person4.lastname')
			person4.lastname = TEST_LASTNAME4
			person4.save()
			Model.dbmodel(DB1).byName(TEST_PERSON4)
				.onReady(function(newperson) {
					self.assertEquals('testset1', newperson.name, TEST_PERSON4, 'person4.name')
					self.assertEquals('testset1', newperson.lastname, TEST_LASTNAME4, 'person4.lastname')
					self.next()
				})
		})
}

// Set new field in loading state
Tests.prototype.testset2 = function() {
	var self = this
	var person = Model.dbmodel(DB1).byName(TEST_PERSON3)
	person.lastname = TEST_LASTNAME3
	person.save()
	
	var updateCalled = false
	person.onAdd(function(p) {
		self.assertFail('testset2', 'onAdd should NOT be called')
	}).onUpdate(function(p) {
		self.assertEquals('testset2 onUpdate called', person, p, 'person', 'p')
		updateCalled = true
	}).onSave(function(p) {
		self.assertEquals('testset2', updateCalled, true, 'updateCalled')
		self.assertEquals('testset2 onSave called', person, p, 'person', 'p')
		Model.dbmodel(DB1).byName(TEST_PERSON3)
			.onReady(function(person3) {
				self.assertEquals('testset2', person3.name, TEST_PERSON3, 'person3.name')
				self.assertEquals('testset2', person3.lastname, TEST_LASTNAME3, 'person3.lastname')
				self.next()
			})
	})
}

// Set new relation in ready state
Tests.prototype.testset3 = function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON3)
		.onReady(function(person) {
			Model.dbmodel(DB2).byTitle(TEST_TITLE4)
				.onReady(function (job) {
					job.ceo = person
					job.onSave(function(j) {
						self.assertEquals('testset3 onSave', job, j, 'job')
						self.assertEquals('testset3', job.ceo.name, TEST_PERSON3, 'job.ceo.name')
						self.next()
					}).save()
				})
		})
}

// Set new relation in loading state
Tests.prototype.testset4 = function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON2)
		.onReady(function(person) {
			var job = Model.dbmodel(DB2).byTitle(TEST_TITLE1)
			job.ceo = person
			self.assertEquals('testset4', job.ceo.name, TEST_PERSON2, 'job.ceo.name')
			job.onSave(function(j) {
				self.assertPass('testset4', 'job.ceo saved')
				Model.dbmodel(DB2).byTitle(TEST_TITLE1).ceo
					.onReady(function(ceo) {
						self.assertEquals('testset4', ceo.name, TEST_PERSON2, 'ceo.name')
						self.next()
					})
			}).save()
		})
}

// Set chaining
Tests.prototype.testset5 = function() {
	var self = this
	var count=0
	Model.dbmodel(DB1).byName(TEST_PERSON1).lastname2.set('Okay').save()
		.onSave(function() {
			Model.dbmodel(DB1).byName(TEST_PERSON1).lastname2
				.onReady(function(ln){
					self.assertEquals('testset5', ln, 'Okay', 'ln')
					count++
					if (count >= 2)
						self.next()
				})

			Model.dbmodel(DB1).byLastname2('Okay').name
				.onReady(function(reversename){
					self.assertEquals('testset5', reversename, TEST_PERSON1, 'reversename')
					count++
					if (count >= 2)
						self.next()
				})

		})

}

// Watch
var Watcher = function(tests, testcase, required, allowed) {
	var self = this
	this.tests = tests
	this.allowed = allowed || {}
	this.required = required || {}
	Launch.each(required, function(i) {
		self.allowed[i] = true
	})
	this.testcase = testcase
}

Watcher.prototype._onError = function(error) {
	this.error = error
	this.tests.assertEquals (this.testcase, this.allowed.error, true, 'this.allowed.error')
	if (this.required.error)
		this.tests.next()
}
Watcher.prototype._onReady = function(obj) {
	this.load = obj
	this.tests.assertEquals (this.testcase, this.allowed.load, true, 'this.allowed.load')
	if (this.required.load)
		this.tests.next()
}
Watcher.prototype._onSave = function(obj) {
	this.save = obj
	this.tests.assertEquals (this.testcase, this.allowed.save, true, 'this.allowed.save')
	if (this.required.save)
		this.tests.next()
}
Watcher.prototype._onAdd = function(obj) {
	this.add = obj
	this.tests.assertEquals (this.testcase, this.allowed.add, true, 'this.allowed.add')
	if (this.required.add)
		this.tests.next()
}

// Watch handler for load
Tests.prototype.testwatch1 = function() {
	var self = this
	var watcher = new Watcher(this, 'testwatch1',{load: true})
	Model.dbmodel(DB1).byName(TEST_PERSON1).watch(watcher)
}

// Watch handler when explicit listener is present
Tests.prototype.testwatch2 = function() {
	var self = this
	var watcher = new Watcher(this, 'testwatch2',{})
	Model.dbmodel(DB1).byName(TEST_PERSON1).watch(watcher)
		.onReady(function(obj) {
			self.assertEquals('testwatch2', obj.name, TEST_PERSON1)
			self.next()
		})
}

// Listing tables
Tests.prototype.testlist1 = function() {
	var self = this
	var mylist = Wrapper(Model.dbmodel(DB1), new Object).list({ident: 1})
		.onReady(function(persons) {
			var count = 0
			persons.each(function(i, v) {
				count++
			})
			self.assertEquals('testlist1.0', count, 4, 'count')
			self.assertEquals('testlist1.1', persons.length, 4, 'persons.length')
			self.assertEquals('testlist1.2', !(!(persons.get(0).name.match(/^Person/))), true, 'valid persons.get(0).name')
			self.next()
		}).onError(function(err) {
			self.assertFail("testlist1.error", "Error handler should not be called. Message " + err)
		})
}

// One to many relation - assign when ready
Tests.prototype.testlist2 = function() {
	var self = this
	Model.dbmodel(DB2).byTitle(TEST_TITLE1)
		.onReady(function(title) {
			Model.dbmodel(DB2).byTitle(TEST_TITLE2)
				.onReady(function(title2) {
					Model.dbmodel(DB1).findadd({name:TEST_PERSON9})
						.onReady(function() {
							Model.dbmodel(DB1).find({name:TEST_PERSON9}).jobs
								.append(title)
								.append(title2)
								.onReady(function(jobs) {
									self.assertEquals("testlist2.1", jobs.length, 2, 'person.name')
									self.assertEquals("testlist2.2", jobs.get(0).title, TEST_TITLE1, 'jobs.get(0).name')
									self.assertEquals("testlist2.3", jobs.get(1).title, TEST_TITLE2, 'jobs.get(1).name')
								})
								.onSave(function() {
									self.assertPass("testlist2.4", "One to may relation saved")
									self.next()
								})
								.save()
						})
				})
		})

}

// Access one-to-many relation in a ready object
Tests.prototype.testlist3 = function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON9).jobs
		.onReady(function(jobs) {
			self.assertEquals('testlist3.1', jobs.length, 2, 'jobs.length')
			self.assertEquals("testlist3.2", jobs.get(0).title, TEST_TITLE1, 'jobs.get(0).name')
			self.assertEquals("testlist3.3", jobs.get(1).title, TEST_TITLE2, 'jobs.get(1).name')
			self.next()
		})
}

// Access one-to-many relation in a loading state
Tests.prototype.testlist4 = function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON9).jobs.get(0)
		.onReady(function(job) {
			self.assertEquals('testlist4.1', job.title, TEST_TITLE1, 'job.title')
			self.next()
		})

}

// Access subfield of a one-to-many relation in a loading state
Tests.prototype.testlist5 = function() {
	var self = this
	var jobs = Model.dbmodel(DB1).byName(TEST_PERSON9).jobs
	self.assertEquals('testlist5.1', jobs.get(0), jobs.get(0), 'person.jobs.get(0)', 'person.jobs.get(0)')
	jobs.get(0).title
		.onReady(function(title) {
			self.assertEquals('testlist5.2', title, TEST_TITLE1, 'title')
			self.next()
		})
}

// Add pending objects to one-to-many relation of a waiting object
Tests.prototype.testlist6 = function() {
	var self = this

	var person = Model.dbmodel(DB1).byName(TEST_PERSON1).jobs
		.append(Model.dbmodel(DB2).byTitle("Title 1"))
		.append(Model.dbmodel(DB2).byTitle("Title 2"))
		.onSave(function(person) {
			self.assertPass("testlist6", "One-to-many saved")
		}).onReady(function(jobs) {
			self.assertEquals("testlist6.1", jobs.length, 2, 'person.jobs.length')
			self.assertEquals("testlist6.2", jobs.get(0).title, TEST_TITLE1, 'jobs.get(0).title')
			self.assertEquals("testlist6.3", jobs.get(1).title, TEST_TITLE2, 'jobs.get(1).title')
			self.next()
		})
		.save()
}

// Append pending objects to one-to-many relation of a waiting object 
// depends on 6
Tests.prototype.testlist7 = function() {
	var self = this

	var person = Model.dbmodel(DB1).byName(TEST_PERSON1).jobs
		.append(Model.dbmodel(DB2).byTitle("Title 3"))
		.append(Model.dbmodel(DB2).byTitle("Title 4"))
		.onSave(function(person) {
			self.assertPass("testlist7", "One-to-many saved")
			Model.dbmodel(DB1).byName(TEST_PERSON1).jobs
			
				.onReady(function(jobs) {
					self.assertEquals("testlist7.1", jobs.length, 4, 'person.jobs.length')
					self.assertEquals("testlist7.2", jobs.get(0).title, TEST_TITLE1, 'jobs.get(0).title')
					self.assertEquals("testlist7.3", jobs.get(1).title, TEST_TITLE2, 'jobs.get(1).title')
					self.assertEquals("testlist7.4", jobs.get(2).title, TEST_TITLE3, 'jobs.get(2).title')
					self.assertEquals("testlist7.5", jobs.get(3).title, TEST_TITLE4, 'jobs.get(3).title')
					self.next()
				})
		})
		.save()
}

// Special ops
Tests.prototype.testspinc1 = function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON1).counter.set(1)
		.onSave(function(person) {
			self.assertPass("testspinc1.0", "Counter saved")
			Model.dbmodel(DB1).byName(TEST_PERSON1)
				.onReady(function(person) {
					self.assertEquals('testspinc1.1', person.counter, 1, 'person.counter')
					self.next()
				})
		})
		.save()
}

Tests.prototype.testspinc2 = function() {
	var self = this
	Model.dbmodel(DB1).byName(TEST_PERSON1).counter.set('$inc')
		.onSave(function(person) {
			self.assertPass("testspinc2.0", "Counter saved")
			self.next()
		})
		.save()
}

// Add pending objects to one-to-many relation of a waiting object

Tests.prototype.finish =  function() {
	Jstest.prototype.finish.call(this)
	console.log('All finished')
	process.exit(0)
}

var set = undefined
if (process.argv[2] == '-i') {
	set = 'testinit'
}

process.argv.shift()
process.argv.shift()
Model.enableDebug('api')
Model.disableDebug()

var tests = new Tests()
tests.showPass = true
tests.start(process.argv)
