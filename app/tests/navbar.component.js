import { Selector } from 'testcafe';

class NavBar {
  async gotoLandingPage(testController) {
    await testController.click('#landing-page');
  }

  async gotoAboutUsPage(testController) {
    await testController.click('#about-us-nav');
  }

  async gotoEditProfilePage(testController) {
    await testController.click('#edit-profile-nav');
  }

  async gotoResourcesPage(testController) {
    const visible = await Selector('#basic-navbar-nav').visible;
    if (!visible) {
      await testController.click('button.navbar-toggler');
    }
    await testController.click('#resources-nav');
  }

  async gotoResourcesAdminPage(testController) {
    const visible = await Selector('#basic-navbar-nav').visible;
    if (!visible) {
      await testController.click('button.navbar-toggler');
    }
    await testController.click('#resources-admin-nav');
  }

  async gotoReportPage(testController) {
    await testController.click('#reports-nav');
  }

  async gotoPostsPage(testController) {
    const visible = await Selector('#basic-navbar-nav').visible;
    if (!visible) {
      await testController.click('button.navbar-toggler');
    }
    await testController.click('#posts-nav');
  }

  async gotoPostsAdminPage(testController) {
    const visible = await Selector('#basic-navbar-nav').visible;
    if (!visible) {
      await testController.click('button.navbar-toggler');
    }
    await testController.click('#posts-admin-nav');
  }
}

export const navBar = new NavBar();
