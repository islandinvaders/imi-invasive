import { Selector } from 'testcafe';
import { navBar } from './navbar.component';

class PostsAdminPage {
  constructor() {
    this.pageId = '#posts-admin';
    this.pageSelector = Selector(this.pageId);
  }

  /** Asserts that this page is currently displayed. */
  async isDisplayed(testController) {
    await testController.expect(this.pageSelector.exists).ok();
  }

  async viewVerifiedOrAll(testController) {
    await testController.click('#posts-admin-verified-button');
  }

  async downloadCSV(testController) {
    await testController.click('#download-csv');
  }

  async gotoEditReport(testController) {
    await testController.click('#posts-admin-edit');
  }

  async deletePost(testController) {
    await navBar.gotoLandingPage(testController);
    await navBar.gotoPostsAdminPage(testController);
    await this.viewVerifiedOrAll(testController);
  }

  async verificationStatusTrue(testController) {
    await testController.click('#posts-admin-ver-status');
    await testController.click('#posts-admin-ver-status-yes');
  }

  async verificationStatusFalse(testController) {
    await testController.click('#posts-admin-ver-status');
    await testController.click('#posts-admin-ver-status-no');
  }
}

export const postsAdminPage = new PostsAdminPage();
