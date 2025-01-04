import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css' // optional, default theme
import popper from '@popperjs/core'
import { AutoFormThemeBootstrap5 } from 'meteor/communitypackages:autoform-bootstrap5/static'
import { AutoForm } from 'meteor/aldeed:autoform/static'

AutoForm.load()
AutoFormThemeBootstrap5.load()
AutoForm.setDefaultTemplate('bootstrap5')
window.Popper = popper
