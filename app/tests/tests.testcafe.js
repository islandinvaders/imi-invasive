import { landingPage } from './landing.page';
import { signinPage } from './signin.page';
import { signoutPage } from './signout.page';
import { navBar } from './navbar.component';
import { resourcesPage } from './resources.page';
// import { resourcesAdminPage } from './resources.admin.page';
// import { postsPage } from './posts.page';
import { loginComponent } from './login.component';
import { postsPage } from './posts.page';
// import login from '../imports/ui/components/Login';

/* global fixture:false, test:false */

/** Credentials for one of the sample users defined in settings.development.json. */
const credentials = { username: 'john@foo.com', password: 'changeme' };
// const admin = { username: 'admin@foo.com', password: 'changeme' };

const pestName = 'Mongoose';

fixture('meteor-application-template-react localhost test with default db')
  .page('http://localhost:3000');

test('Test that landing page shows up', async (testController) => {
  await landingPage.isDisplayed(testController);
});

test('Test that signin and signout work', async (testController) => {
  await loginComponent.gotoSignInPage(testController);
  await signinPage.signin(testController, credentials.username, credentials.password);
  await loginComponent.isLoggedIn(testController, credentials.username);
  await loginComponent.logout(testController);
  await signoutPage.isDisplayed(testController);
});

test('Test user Posts page', async (testController) => {
  await navBar.gotoLandingPage(testController);
  await loginComponent.gotoSignInPage(testController);
  await signinPage.signin(testController, credentials.username, credentials.password);
  await loginComponent.isLoggedIn(testController, credentials.username);
  await navBar.gotoPostsPage(testController);
  /* await postsPage.switchDisplay(testController);
  await postsPage.isDisplayed(testController);
  await postsPage.switchDisplay(testController);
  await postsPage.isDisplayed(testController);
  await postsPage.downloadCSV(testController);
  await loginComponent.logout(testController);
  await signoutPage.isDisplayed(testController); */
});

test('Test access to user resources page', async (testController) => {
  await navBar.gotoLandingPage(testController);
  await loginComponent.gotoSignInPage(testController);
  await signinPage.signin(testController, credentials.username, credentials.password);
  await loginComponent.isLoggedIn(testController, credentials.username);
  await navBar.gotoResourcesPage(testController);
  await resourcesPage.search(testController, pestName);
  await resourcesPage.filter(testController, 'Plant');
  await loginComponent.logout(testController);
  await signoutPage.isDisplayed(testController);
});

/*
test('Test admin resources page', async (testController) => {
  await navBar.gotoLandingPage(testController);
  await loginComponent.gotoSignInPage(testController);
  await signinPage.signin(testController, admin.username, admin.password);
  await loginComponent.isLoggedIn(testController, credentials.username);
  await navBar.gotoResourcesAdminPage(testController);
  await resourcesAdminPage.deleteResource(testController);
});
 */
