import { Selector } from 'testcafe';
import { navBar } from './navbar.component';
import { landingPage } from './landing.page';
import { signinPage } from './signin.page';

class LoginComponent {

  /** If someone is logged in, then log them out, otherwise do nothing. */
  async ensureLogout(testController) {
    const loggedInUser = await Selector('#navbar-current-user').exists;
    if (loggedInUser) {
      await testController.click('#navbar-current-user');
      await testController.click('#navbar-sign-out');
    }
  }

  async gotoSignInPage(testController) {
    await this.ensureLogout(testController);
    const visible = await Selector('#basic-navbar-nav').visible;
    if (!visible) {
      await testController.click('#login-dropdown');
    }
    await testController.click('#login-dropdown-sign-in');
  }

  /** Check that the specified user is currently logged in. */
  async isLoggedIn(testController, username) {
    const loggedInUser = Selector('#login-current-user').innerText;
    await testController.expect(loggedInUser).eql(username);
  }

  /** Check that someone is logged in, then click items to logout. */
  async logout(testController) {
    const visible = await Selector('#basic-navbar-nav').visible;
    if (!visible) {
      await testController.click('button.navbar-toggler');
    }
    await testController.expect(Selector('#login-current-user').exists).ok();
    await testController.click('#login-current-user');
    await testController.click('#login-sign-out');
  }

  /** Pull down login menu, go to sign up page. */
  async gotoSignUpPage(testController) {
    await this.ensureLogout(testController);
    const visible = await Selector('#basic-navbar-nav').visible;
    if (!visible) {
      await testController.click('#login-dropdown');
    }
    await testController.click('#login-dropdown-sign-up');
  }

  async testLogin(testController, credentials) {
    await navBar.gotoLandingPage(testController);
    await testController.wait(1000);
    await landingPage.isDisplayed(testController);
    await this.gotoSignInPage(testController);
    await signinPage.signin(testController, credentials.username, credentials.password);
    await this.isLoggedIn(testController, credentials.username);

  }
}

export const loginComponent = new LoginComponent();
