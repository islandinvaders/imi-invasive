(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"tmeasday:check-npm-versions":{"check-npm-versions.ts":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/tmeasday_check-npm-versions/check-npm-versions.ts                                                      //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
!function (module1) {
  module1.export({
    checkNpmVersions: () => checkNpmVersions
  });
  let Meteor;
  module1.link("meteor/meteor", {
    Meteor(v) {
      Meteor = v;
    }
  }, 0);
  let semver;
  module1.link("semver", {
    default(v) {
      semver = v;
    }
  }, 1);
  // Returns:
  //   - true      if a version of the package in the range is installed
  //   - false     if no version is installed
  //   - version#  if incompatible version is installed
  const compatibleVersionIsInstalled = (name, range) => {
    try {
      const installedVersion = require("".concat(name, "/package.json")).version;
      if (semver.satisfies(installedVersion, range)) {
        return true;
      } else {
        return installedVersion;
      }
    } catch (e) {
      // XXX add something to the tool to make this more reliable
      const message = e.toString();
      // One message comes out of the install npm package the other from npm directly
      if (message.includes('Cannot find module') === true || message.includes("Can't find npm module") === true) {
        return false;
      } else {
        throw e;
      }
    }
  };
  const checkNpmVersions = (packages, packageName) => {
    if (Meteor.isDevelopment) {
      const failures = {};
      Object.keys(packages).forEach(name => {
        const range = packages[name];
        const failure = compatibleVersionIsInstalled(name, range);
        if (failure !== true) {
          failures[name] = failure;
        }
      });
      if (Object.keys(failures).length === 0) {
        return;
      }
      const errors = [];
      Object.keys(failures).forEach(name => {
        const installed = failures[name];
        const requirement = "".concat(name, "@").concat(packages[name]);
        if (installed) {
          errors.push(" - ".concat(name, "@").concat(installed, " installed, ").concat(requirement, " needed"));
        } else {
          errors.push(" - ".concat(name, "@").concat(packages[name], " not installed."));
        }
      });
      const qualifier = packageName ? "(for ".concat(packageName, ") ") : '';
      console.warn("WARNING: npm peer requirements ".concat(qualifier, "not installed:\n  ").concat(errors.join('\n'), "\n\n  Read more about installing npm peer dependencies:\n    http://guide.meteor.com/using-packages.html#peer-npm-dependencies\n  "));
    }
  };
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"semver":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// node_modules/meteor/tmeasday_check-npm-versions/node_modules/semver/package.json                                //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
module.exports = {
  "name": "semver",
  "version": "6.3.0",
  "main": "semver.js"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"semver.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// node_modules/meteor/tmeasday_check-npm-versions/node_modules/semver/semver.js                                   //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".ts"
  ]
});

var exports = require("/node_modules/meteor/tmeasday:check-npm-versions/check-npm-versions.ts");

/* Exports */
Package._define("tmeasday:check-npm-versions", exports);

})();

//# sourceURL=meteor://💻app/packages/tmeasday_check-npm-versions.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvdG1lYXNkYXk6Y2hlY2stbnBtLXZlcnNpb25zL2NoZWNrLW5wbS12ZXJzaW9ucy50cyJdLCJuYW1lcyI6WyJtb2R1bGUxIiwiZXhwb3J0IiwiY2hlY2tOcG1WZXJzaW9ucyIsIk1ldGVvciIsImxpbmsiLCJ2Iiwic2VtdmVyIiwiZGVmYXVsdCIsImNvbXBhdGlibGVWZXJzaW9uSXNJbnN0YWxsZWQiLCJuYW1lIiwicmFuZ2UiLCJpbnN0YWxsZWRWZXJzaW9uIiwicmVxdWlyZSIsImNvbmNhdCIsInZlcnNpb24iLCJzYXRpc2ZpZXMiLCJlIiwibWVzc2FnZSIsInRvU3RyaW5nIiwiaW5jbHVkZXMiLCJwYWNrYWdlcyIsInBhY2thZ2VOYW1lIiwiaXNEZXZlbG9wbWVudCIsImZhaWx1cmVzIiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJmYWlsdXJlIiwibGVuZ3RoIiwiZXJyb3JzIiwiaW5zdGFsbGVkIiwicmVxdWlyZW1lbnQiLCJwdXNoIiwicXVhbGlmaWVyIiwiY29uc29sZSIsIndhcm4iLCJqb2luIiwiY2FsbCIsIm1vZHVsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBQUFBLE9BQU8sQ0FBQUMsTUFBRSxDQUFNO0lBQUFDLGdCQUFRLEVBQUFBLENBQUEsS0FBQUE7RUFBZ0I7RUFBQSxJQUFBQyxNQUFBO0VBQUFILE9BQUEsQ0FBQUksSUFBQTtJQUFBRCxPQUFBRSxDQUFBO01BQUFGLE1BQUEsR0FBQUUsQ0FBQTtJQUFBO0VBQUE7RUFBQSxJQUFBQyxNQUFBO0VBQUFOLE9BQUEsQ0FBQUksSUFBQTtJQUFBRyxRQUFBRixDQUFBO01BQUFDLE1BQUEsR0FBQUQsQ0FBQTtJQUFBO0VBQUE7RUFhdkM7RUFDQTtFQUNBO0VBQ0E7RUFDQSxNQUFNRyw0QkFBNEIsR0FBR0EsQ0FBQ0MsSUFBWSxFQUFFQyxLQUE0QixLQUFrQjtJQUNoRyxJQUFJO01BQ0YsTUFBTUMsZ0JBQWdCLEdBQUdDLE9BQU8sSUFBQUMsTUFBQSxDQUFJSixJQUFJLGtCQUFlLENBQUMsQ0FBQ0ssT0FBTztNQUNoRSxJQUFJUixNQUFNLENBQUNTLFNBQVMsQ0FBQ0osZ0JBQWdCLEVBQUVELEtBQUssQ0FBQyxFQUFFO1FBQzdDLE9BQU8sSUFBSTtPQUNaLE1BQU07UUFDTCxPQUFPQyxnQkFBZ0I7O0tBRTFCLENBQUMsT0FBT0ssQ0FBQyxFQUFFO01BQ1Y7TUFDQSxNQUFNQyxPQUFPLEdBQUdELENBQUMsQ0FBQ0UsUUFBUSxFQUFFO01BQzVCO01BQ0EsSUFBSUQsT0FBTyxDQUFDRSxRQUFRLENBQUMsb0JBQW9CLENBQUMsS0FBSyxJQUFJLElBQUlGLE9BQU8sQ0FBQ0UsUUFBUSxDQUFDLHVCQUF1QixDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ3pHLE9BQU8sS0FBSztPQUNiLE1BQU07UUFDTCxNQUFNSCxDQUFDOzs7RUFHYixDQUFDO0VBRU0sTUFBTWQsZ0JBQWdCLEdBQUdBLENBQUNrQixRQUFrQixFQUFFQyxXQUFtQixLQUFVO0lBQ2hGLElBQUlsQixNQUFNLENBQUNtQixhQUFhLEVBQUU7TUFDeEIsTUFBTUMsUUFBUSxHQUFzQixFQUFFO01BRXRDQyxNQUFNLENBQUNDLElBQUksQ0FBQ0wsUUFBUSxDQUFDLENBQUNNLE9BQU8sQ0FBRWpCLElBQUksSUFBSTtRQUNyQyxNQUFNQyxLQUFLLEdBQUdVLFFBQVEsQ0FBQ1gsSUFBSSxDQUFDO1FBQzVCLE1BQU1rQixPQUFPLEdBQUduQiw0QkFBNEIsQ0FBQ0MsSUFBSSxFQUFFQyxLQUFLLENBQUM7UUFFekQsSUFBSWlCLE9BQU8sS0FBSyxJQUFJLEVBQUU7VUFDcEJKLFFBQVEsQ0FBQ2QsSUFBSSxDQUFDLEdBQUdrQixPQUFPOztNQUU1QixDQUFDLENBQUM7TUFFRixJQUFJSCxNQUFNLENBQUNDLElBQUksQ0FBQ0YsUUFBUSxDQUFDLENBQUNLLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDdEM7O01BR0YsTUFBTUMsTUFBTSxHQUFhLEVBQUU7TUFFM0JMLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDRixRQUFRLENBQUMsQ0FBQ0csT0FBTyxDQUFFakIsSUFBSSxJQUFJO1FBQ3JDLE1BQU1xQixTQUFTLEdBQUdQLFFBQVEsQ0FBQ2QsSUFBSSxDQUFDO1FBQ2hDLE1BQU1zQixXQUFXLE1BQUFsQixNQUFBLENBQU1KLElBQUksT0FBQUksTUFBQSxDQUFJTyxRQUFRLENBQUNYLElBQUksQ0FBQyxDQUFFO1FBRS9DLElBQUlxQixTQUFTLEVBQUU7VUFDYkQsTUFBTSxDQUFDRyxJQUFJLE9BQUFuQixNQUFBLENBQU9KLElBQUksT0FBQUksTUFBQSxDQUFJaUIsU0FBUyxrQkFBQWpCLE1BQUEsQ0FBZWtCLFdBQVcsWUFBUyxDQUFDO1NBQ3hFLE1BQU07VUFDTEYsTUFBTSxDQUFDRyxJQUFJLE9BQUFuQixNQUFBLENBQU9KLElBQUksT0FBQUksTUFBQSxDQUFJTyxRQUFRLENBQUNYLElBQUksQ0FBQyxvQkFBaUIsQ0FBQzs7TUFFOUQsQ0FBQyxDQUFDO01BRUYsTUFBTXdCLFNBQVMsR0FBR1osV0FBVyxXQUFBUixNQUFBLENBQVdRLFdBQVcsVUFBTyxFQUFFO01BQzVEYSxPQUFPLENBQUNDLElBQUksbUNBQUF0QixNQUFBLENBQW1Db0IsU0FBUyx3QkFBQXBCLE1BQUEsQ0FDeERnQixNQUFNLENBQUNPLElBQUksQ0FBQyxJQUFJLENBQUMsdUlBSWxCLENBQUM7O0VBRUosQ0FBQztBQUFDLEVBQUFDLElBQUEsT0FBQUMsTUFBQSxFIiwiZmlsZSI6Ii9wYWNrYWdlcy90bWVhc2RheV9jaGVjay1ucG0tdmVyc2lvbnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcblxudHlwZSBib29sT3JTdHJpbmcgPSBib29sZWFuIHwgc3RyaW5nO1xuXG5pbnRlcmZhY2UgaW5kZXhCb29sb3JTdHJpbmcge1xuICBba2V5OiBzdHJpbmddOiBib29sT3JTdHJpbmdcbn1cblxuaW50ZXJmYWNlIGluZGV4QW55IHtcbiAgW2tleTogc3RyaW5nXTogYW55XG59XG5cbi8vIFJldHVybnM6XG4vLyAgIC0gdHJ1ZSAgICAgIGlmIGEgdmVyc2lvbiBvZiB0aGUgcGFja2FnZSBpbiB0aGUgcmFuZ2UgaXMgaW5zdGFsbGVkXG4vLyAgIC0gZmFsc2UgICAgIGlmIG5vIHZlcnNpb24gaXMgaW5zdGFsbGVkXG4vLyAgIC0gdmVyc2lvbiMgIGlmIGluY29tcGF0aWJsZSB2ZXJzaW9uIGlzIGluc3RhbGxlZFxuY29uc3QgY29tcGF0aWJsZVZlcnNpb25Jc0luc3RhbGxlZCA9IChuYW1lOiBzdHJpbmcsIHJhbmdlOiBzdHJpbmcgfCBzZW12ZXIuUmFuZ2UpOiBib29sT3JTdHJpbmcgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IGluc3RhbGxlZFZlcnNpb24gPSByZXF1aXJlKGAke25hbWV9L3BhY2thZ2UuanNvbmApLnZlcnNpb247XG4gICAgaWYgKHNlbXZlci5zYXRpc2ZpZXMoaW5zdGFsbGVkVmVyc2lvbiwgcmFuZ2UpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGluc3RhbGxlZFZlcnNpb247XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gWFhYIGFkZCBzb21ldGhpbmcgdG8gdGhlIHRvb2wgdG8gbWFrZSB0aGlzIG1vcmUgcmVsaWFibGVcbiAgICBjb25zdCBtZXNzYWdlID0gZS50b1N0cmluZygpO1xuICAgIC8vIE9uZSBtZXNzYWdlIGNvbWVzIG91dCBvZiB0aGUgaW5zdGFsbCBucG0gcGFja2FnZSB0aGUgb3RoZXIgZnJvbSBucG0gZGlyZWN0bHlcbiAgICBpZiAobWVzc2FnZS5pbmNsdWRlcygnQ2Fubm90IGZpbmQgbW9kdWxlJykgPT09IHRydWUgfHwgbWVzc2FnZS5pbmNsdWRlcyhcIkNhbid0IGZpbmQgbnBtIG1vZHVsZVwiKSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGNoZWNrTnBtVmVyc2lvbnMgPSAocGFja2FnZXM6IGluZGV4QW55LCBwYWNrYWdlTmFtZTogc3RyaW5nKTogdm9pZCA9PiB7XG4gIGlmIChNZXRlb3IuaXNEZXZlbG9wbWVudCkge1xuICAgIGNvbnN0IGZhaWx1cmVzOiBpbmRleEJvb2xvclN0cmluZyA9IHt9O1xuXG4gICAgT2JqZWN0LmtleXMocGFja2FnZXMpLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICAgIGNvbnN0IHJhbmdlID0gcGFja2FnZXNbbmFtZV07XG4gICAgICBjb25zdCBmYWlsdXJlID0gY29tcGF0aWJsZVZlcnNpb25Jc0luc3RhbGxlZChuYW1lLCByYW5nZSk7XG5cbiAgICAgIGlmIChmYWlsdXJlICE9PSB0cnVlKSB7XG4gICAgICAgIGZhaWx1cmVzW25hbWVdID0gZmFpbHVyZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChPYmplY3Qua2V5cyhmYWlsdXJlcykubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgT2JqZWN0LmtleXMoZmFpbHVyZXMpLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICAgIGNvbnN0IGluc3RhbGxlZCA9IGZhaWx1cmVzW25hbWVdO1xuICAgICAgY29uc3QgcmVxdWlyZW1lbnQgPSBgJHtuYW1lfUAke3BhY2thZ2VzW25hbWVdfWA7XG5cbiAgICAgIGlmIChpbnN0YWxsZWQpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goYCAtICR7bmFtZX1AJHtpbnN0YWxsZWR9IGluc3RhbGxlZCwgJHtyZXF1aXJlbWVudH0gbmVlZGVkYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlcnJvcnMucHVzaChgIC0gJHtuYW1lfUAke3BhY2thZ2VzW25hbWVdfSBub3QgaW5zdGFsbGVkLmApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgcXVhbGlmaWVyID0gcGFja2FnZU5hbWUgPyBgKGZvciAke3BhY2thZ2VOYW1lfSkgYCA6ICcnO1xuICAgIGNvbnNvbGUud2FybihgV0FSTklORzogbnBtIHBlZXIgcmVxdWlyZW1lbnRzICR7cXVhbGlmaWVyfW5vdCBpbnN0YWxsZWQ6XG4gICR7ZXJyb3JzLmpvaW4oJ1xcbicpfVxuXG4gIFJlYWQgbW9yZSBhYm91dCBpbnN0YWxsaW5nIG5wbSBwZWVyIGRlcGVuZGVuY2llczpcbiAgICBodHRwOi8vZ3VpZGUubWV0ZW9yLmNvbS91c2luZy1wYWNrYWdlcy5odG1sI3BlZXItbnBtLWRlcGVuZGVuY2llc1xuICBgKTtcbiAgfVxufTtcbiJdfQ==
