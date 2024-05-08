import { Selector } from 'testcafe';

class PostsPage {
  constructor() {
    this.pageId = '#posts';
    this.pageSelector = Selector(this.pageId);
  }

  /** Asserts that this page is currently displayed. */
  async isDisplayed(testController) {
    await testController.expect(this.pageSelector.exists).ok();
  }

  async search(testController, pestName) {
    await testController.typeText('#resources-search', pestName);
  }

  async viewMyPosts(testController) {
    await testController.click('#view-my-posts');
  }

  async downloadCSV(testController) {
    await testController.click('#download-csv');
  }
}

export const postsPage = new PostsPage();
