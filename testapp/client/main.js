import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { Tracker } from 'meteor/tracker'
import SimpleSchema from 'meteor/aldeed:simple-schema'
import './setup'
import './main.html'


SimpleSchema.extendOptions(['autoform'])
const schema = new SimpleSchema({
  name: {
    type: String,
    min: 2,
    max: 20
  },
  age: {
    type: Number,
    min: 18,
    max: () => {
      const name = AutoForm.getFieldValue('name')
      return name === 'Jan' ? 999 : 100
    },
    autoform: {
      defaultValue: 18,
    }
  }
}, { tracker: Tracker })

Template.body.onCreated(function () {
  const instance = this
  instance.user = new ReactiveVar()
})

Template.body.helpers({
  schema () {
    return schema
  },
  userDoc () {
    return Template.instance().user.get()
  }
})

Template.body.events({
  'submit #userForm' (event, instance) {
    event.preventDefault()
    const { insertDoc } = AutoForm.getFormValues('userForm')
    instance.user.set(insertDoc)
  }
})
