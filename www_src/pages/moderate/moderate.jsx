var React = require('react/addons');

var xhr = require('xhr');
var api = require('../../lib/api.js');
var render = require('../../lib/render.jsx');
var Link = require('../../components/link/link.jsx');
var ModerateCard = require('../../components/moderate-card/moderate-card.jsx');
var Loading = require('../../components/loading/loading.jsx');
var qs = require('qs');

var Moderate = React.createClass({
  mixins: [],
  getInitialState: function () {
    return {
      projects: [],
      loading: false
    };
  },
  load: function () {
    var query = qs.parse(window.location.search ? window.location.search.substr(1) : '');

    this.setState({loading: true});
    api({
      uri: '/projects' + (query.page ? '/?page=' + query.page : '') ,
      useCache: true
    }, (err, body) => {
      this.setState({loading: false});
      if (err) {
        return console.error('Error getting projects', err);
      }

      if (!body || !body.projects || !body.projects.length) {
        return console.log('No projects found');
      }

      this.setState({
        projects: body.projects
      });
    });
  },
  componentWillMount: function () {
    this.load();
  },
  featureClicked: function (e) {
    console.log('Feature ', e)
  },
  deleteClicked: function (e) {
    console.log('Delete ', e)
  },
  generateThumbnailClicked: function (e) {
    console.log('Generate Thumbnail for ', e.projectID, e.authorID)

    xhr({
      method: 'GET',
      uri: 'https://api.webmaker.org/users/' + e.authorID + '/projects/' + e.projectID + '/pages',
    }, function (err, resp, body) {

      if (err || resp.statusCode !== 200) {
        console.error('Couldn\'t get project.', JSON.parse(body));
        return;
      }

      var project = JSON.parse(body);
      var firstPage = project.pages.sort(function (a, b) {
        if (a.id > b.id) {
          return 1;
        }
        if (a.id < b.id) {
          return -1;
        }
        return 0;
      })[0];

      var base64ThumbnailURL = btoa('https://beta.webmaker.org/#/thumbnail?user=' + e.authorID + '&project=' + e.projectID + '&page=' + firstPage.id);
      var thumbnailPostURL = 'http://jbuck-wm-screenshot-production.herokuapp.com/mobile-center-cropped/small/webmaker-desktop/' + base64ThumbnailURL;

      console.log(thumbnailPostURL);

      // Can't actually do this because CORS.

      // xhr({
      //   method: 'POST',
      //   uri: 'http://jbuck-wm-screenshot-production.herokuapp.com/mobile-center-cropped/small/webmaker-desktop/' + base64ThumbnailURL
      // }, function (err, resp, body) {
      //   if (err || resp.statusCode !== 200) {
      //     console.error('Couldn\'t contact thumbnail server.', JSON.parse(body));
      //     return;
      //   }

      //   console.log(body);
      // });


    });
  },
  render: function () {
    var query = qs.parse(window.location.search ? window.location.search.substr(1) : '');
    var currentPage = Number(query.page || 1);

    var cards = this.state.projects.map( project => {
      return (
        <ModerateCard
          key={project.id}
          projectID={project.id}
          authorID={project.author.id}
          url={'/users/' + project.author.id + '/projects/' + project.id + '/play'}
          href={'/pages/project/?author=' + project.author.id + '&project=' + project.id}
          thumbnail={project.thumbnail[320]}
          title={project.title}
          author={project.author.username}
          onFeatureClicked={this.featureClicked}
          onDeleteClicked={this.deleteClicked}
          onGenerateThumbnailClicked={this.generateThumbnailClicked} />
      );
    });

    return (
      <div id="moderate">
        {cards}
        <div hidden={this.state.loading || this.state.projects}>Sorry, no projects found.</div>
        <Loading on={this.state.loading} />
        <div id="page-nav">
          { currentPage > 1 ? <Link href={"/pages/moderate/?page=" + (currentPage - 1)}><button>Back</button></Link> : null }
          <Link href={"/pages/moderate/?page=" + (currentPage + 1)}><button>Next</button></Link>
        </div>
      </div>
    );
  }
});

render(Moderate);
