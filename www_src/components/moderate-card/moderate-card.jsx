var React = require('react/addons');
var ImageLoader = require('react-imageloader');
var Link = require('../link/link.jsx');

var ModerateCard = React.createClass({
  statics: {
    DEFAULT_THUMBNAIL: '../../img/default.svg'
  },
  actionsClicked: function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.props.onActionsClick.call(this, this.props);
  },
  featureClicked: function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.props.onFeatureClicked.call(this, this.props);
  },
  deleteClicked: function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.props.onDeleteClicked.call(this, this.props);
  },
  generateThumbnailClicked: function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.props.onGenerateThumbnailClicked.call(this, this.props);
  },
  render: function () {
    return (
      <Link url={this.props.url} href={this.props.href} className="moderate-card">
        <div className="thumbnail">
          <ImageLoader src={this.props.thumbnail || ModerateCard.DEFAULT_THUMBNAIL}></ImageLoader>
        </div>

        <div className="meta">
          <div className="text">
            <div className="title">{this.props.title}</div>
            <div className="author">{this.props.author}</div>
          </div>
          <div className="action" hidden={!this.props.showButton}>
            <button onClick={this.actionsClicked}>
              <img src="../../img/more-dots.svg"/>
            </button>
          </div>
          <div className="moderation">
            <button onClick={this.featureClicked}>Feature</button>
            <button onClick={this.deleteClicked}>Delete</button>
            <button onClick={this.generateThumbnailClicked}>Generate Thumbnail</button>
          </div>
        </div>
      </Link>
    );
  }
});

module.exports = ModerateCard;
