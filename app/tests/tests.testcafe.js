import { landingPage } from './landing.page';
import { signinPage } from './signin.page';
import { signoutPage } from './signout.page';
import { navBar } from './navbar.component';
import { resourcesPage } from './resources.page';
import { resourcesAdminPage } from './resources.admin.page';
import { loginComponent } from './login.component';
import { resourcesFormPage } from './resourceform';
import { signupPage } from './signup.page';
import { postsPage } from './posts.page';

/* global fixture:false, test:false */

/** Credentials for one of the sample users defined in settings.development.json. */
const credentials = { username: 'john@foo.com', password: 'changeme' };
const admin = { username: 'admin@foo.com', password: 'changeme' };
const newUser = { username: 'user@foo.com', password: 'changeme', firstName: 'John', lastName: 'Smith' };

const pestName = 'Mongoose';

const mongooseData = {
  image: 'https://i.pinimg.com/originals/f1/4d/74/f14d74fccd5698545d2b5b02bad55790.jpg',
  pestName: 'Mongoose',
  sciName: 'Herpestes Javanicus',
  risk: 'N/A',
  regStatus: 'HAR 124',
  pestType: 'Animal',
  description: 'Mongoose are a weasel-like animal totaling about 26″ in length with a long, ' +
    'brownish body, short legs and a tail as long as its body. They have small rounded ears and a pointed nose. The mongoose is active during the day and generally sleeps in dens at night',
  impact: 'Mongoose are opportunistic feeders that will eat birds, small mammals, reptiles, insects, fruits, and plants. They prey on the eggs and hatchlings of native ground nesting birds and endangered sea turtles.',
  distribution: 'Maui, Moloka’i, O’ahu',
  lookalike: 'Cats, Rats, Pheasants',
};

/*
const falseReport = {
  image: 'https://dlnr.hawaii.gov/hisc/files/2023/08/Albizia-3-2.jpg',
  pestName: 'Albizia',
  island: 'Kauai',
  Location: 'Puhi',
  pestDescription: 'Tall tree in my backyard.'
};
*/

fixture('meteor-application-template-react localhost test with default db')
  .page('http://localhost:3000');

test('Test that landing page shows up', async (testController) => {
  await landingPage.isDisplayed(testController);
});

test('Test signin and signout', async (testController) => {
  await navBar.gotoLandingPage(testController);
  await testController.wait(1000);
  await landingPage.isDisplayed(testController);
  await loginComponent.gotoSignInPage(testController);
  await signinPage.signin(testController, credentials.username, credentials.password);
  await loginComponent.isLoggedIn(testController, credentials.username);
  await loginComponent.logout(testController);
  await signoutPage.isDisplayed(testController);
});

test('Creating a new account', async (testController) => {
  await navBar.gotoLandingPage(testController);
  await testController.wait(1000);
  await loginComponent.gotoSignUpPage(testController);
  await signupPage.signupUser(testController, newUser.username, newUser.password, newUser.firstName, newUser.lastName);
  await loginComponent.isLoggedIn(testController, newUser.username);
  await loginComponent.logout(testController);
  await signoutPage.isDisplayed(testController);
});

test('Test About Us page on Navbar', async (testController) => {
  loginComponent.testLogin(testController, credentials);
  await testController.wait(2000);
  await navBar.gotoAboutUsPage(testController);
});

test('Test User Editing and viewing profiles', async (testController) => {
  // Login and go to page
  loginComponent.testLogin(testController, credentials);
  await navBar.gotoEditProfilePage(testController);
  // Edit current profile & verify change
  await testController.typeText('#profile-bio', ' and love dogs');
  await testController.typeText('#profile-interests', ' especially dogs');
  await testController.click('#profile-save-changes input.btn.btn-primary');
  await testController.wait(2000);
  await navBar.gotoLandingPage(testController);
  await navBar.gotoEditProfilePage(testController);
  await testController.wait(2000);
  // Viewing other profiles and click on specific one, return back to list
  await testController.click('#list-profiles-button');
  await testController.wait(1000);
  await testController.click('#profile-view-button');
  await testController.click('#view-profile-backtolist');
});

test('Test access to user resources page', async (testController) => {
  // Login and go to page
  await loginComponent.testLogin(testController, credentials);
  await testController.wait(1000);
  await navBar.gotoResourcesPage(testController);
  await resourcesPage.isDisplayed(testController);
  // Test search and filter
  await resourcesPage.search(testController, pestName);
  await resourcesPage.filter(testController, 'Plant');
  // Log out
  await loginComponent.logout(testController);
  await signoutPage.isDisplayed(testController);
});

test('Test admin resources page and form (delete and add resource)', async (testController) => {
  // Admin login and go to page
  await loginComponent.testLogin(testController, admin);
  await testController.wait(1000);
  await navBar.gotoResourcesAdminPage(testController);
  await resourcesAdminPage.isDisplayed(testController);
  // Delete resource
  await resourcesAdminPage.deleteResource(testController);
  // Go to add resource form and add resource
  await resourcesAdminPage.gotoAddResource(testController);
  await resourcesFormPage.addResource(testController, mongooseData);
  await testController.wait(2000);
  // Logout
  await loginComponent.logout(testController);
  await signoutPage.isDisplayed(testController);
});

test('Test user Posts page', async (testController) => {
  // Login and go to page
  await loginComponent.testLogin(testController, credentials);
  await testController.wait(1000);
  await navBar.gotoPostsPage(testController);
  // View your posts
  await postsPage.viewMyPosts(testController);
  // Download CSV
  await postsPage.downloadCSV(testController);
  await testController.wait(2000);
});

/*

test('Test Admin Posts page', async (testController) => {
  // Login and to page
  await loginComponent.testLogin(testController, credentials);
  await testController.wait(1000);

  // Edit post (Submit)
});

test('Test making a new report', async (testController) => {
  // Login and to page
  await loginComponent.testLogin(testController, credentials);
  await testController.wait(1000);
  // await navBar.gotoPostsPage(testController);
  //
});
*/
