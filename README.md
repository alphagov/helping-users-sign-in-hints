# GOV.UK Verify Prototype 3.0



## About the prototype

This is a prototype of version of GOV.UK Verify including example service pages, the Verify hub and a whitelabled IDP journey, that updates branding and stlying to reflect that of the IDP the user selects. 

The prototype includes LoA1, LoA2 and uplift journeys. These have been designed to reflect those of the live journeys.

The prototype has been build using the [GOV.UK prototype toolkit](https://github.com/alphagov/govuk_prototype_kit), more information and documentation and tips can be found there. As part of the toolkit, the prototype also uses Nunjucks to dynamically populate parts of the pages, documentation for that can be found [here](https://mozilla.github.io/nunjucks/templating.html).

## Setting up the prototype

1. Clone this repository

2. In the project folder in terminal run:

   > npm install

To run the prototype, navigate to the project folder in terminal and run:

> node start



## How the prototype works

The prototype is designed to mimic an end to end service on GOV.UK, including Verify and the IDP journey in the middle. 

A typical use case is that the user starts on the service start page, gets sent to the verify hub, which sends them to the IDP journey they select, which passes them back to the hub and finally on to the rest of the service like so:

Service specific start page —> Verify hub —> IDP journey —> Verify hub —>The rest of the service...

The service and hub pages are styled as GOV.UK and the IDP journey is a generic IDP flow that updates its branding and content depending on the choice of the user.

### LOA1 and LOA2 journeys

LOA1, LOA2 and Uplift journeys (users going from LOA1 to LOA2) are included in the prototype. These are initiated by selecting an LOA1 or LOA2 service on the index page. The LOA of a service can be changed using the prototype admin tool found at `/admin` . 

An Uplift journey will require you to also select the Users level of assurance (available as either Unverified, LOA1 or LOA2).

The two journies use the same pages however the routing file `/app/views/routes.js` takes the user through only the pages that are relevant to that journey. Nunjucks is also used on some of the pages to update specific piceces of content (for instance, `/app/views/hub/verify-success.html`).

### Dynamic service content

There is dynamic service specific content available in the prototype to automatically update content thorughout the hub section of the journey, for instance what the service is called or which organisation provides the service. It uses nunjucks and looks something like this:

`<h1 class="heading-large">{{serviceName}}</h1>`

The dynamic service content available is stored in a separate psequel database ( [url]() | [code]() ). The list of services that have already been added appear on the index page. 

New services can be added to the prototype by navigating to the prototype admin tool at `/admin` and following the steps from there.

#### Common service specific variables

These can be used within the code to help make pages more dynamic.

`{{serviceName}}` The name of the service in uppercase

`{{serviceNameLower}}` The name of the service in lowercase

`{{serviceLOA}}` The level of assureance of the service (e.g. '1' or '2')

`{{usersLOA}}` The current level of assurance of the user (e.g. 'undefined', '1' or '2')

`{{serviceProvider}}` The organisation that provides the service (e.g. 'HMRC' or 'DVLA')

`{{serviceOtherWays}}` Predefined html for each service about what channels the user can use to access the service other than Verify

`{{serviceCompleteURL}}` The URL for the page the user should be directed to once they have been verified and passed back from the Verify hub to the relevant page in the service (e.g. `/service/check-state-pension-end`)

### Dynamic IDP content and styling

There is also pre-set variables depending on the IDP the user selects on the picker page. Once the user makes their selection on the picker, the following IDP journey pages will update their colour scheme, logos and self references. The file specifying the list of IDPs is  `/app/lib/idps.json` with the colour shcemes and styling in `/app/assets/sass/idp.scss` and logos in `/app/assets/images/idp-logos`.

#### Common IDP specific variables

These can be used within the code to help make pages more dynamic.

`{{idpName}}` The name of the IDP the user chooses (e.g. 'Post Office')

`{{idpSlug}}` The code for the IDP the user chooses (e.g. 'post-office')







## More information and support

This prototype has been build using the [GOV.UK prototype toolkit](https://github.com/alphagov/govuk_prototype_kit), more information and documentation can be found there.
