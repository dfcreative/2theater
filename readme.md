# To-theater

[![Greenkeeper badge](https://badges.greenkeeper.io/dfcreative/2theater.svg)](https://greenkeeper.io/)

A collection of famous theater plays must see.

To build production into `package.name` root, run

```
$ npm run build
```

To build dev into `_site`, run

```
$ npm run watch
```

### Principles

* Every item is a sub-project with it’s own folder. It’s long-term relationship, not the piece of content.
* Technical info should be separated from data (to `config.json`). It should be presented as `item.config` in data, because config is a temporary representational setup, but item itself is eternal.
* As far data needs to be translated, keep it as a frontmatter per index file.
* Each index markdown contains only infologic data, it should not contain representational nuances nor duplicates.
* Name directories and data in singular manner: _image_, not _images_; _play_, not _plays_.
* Item’s _index.md_ is a locale-independent info file, used as main. Each _i18n/{{ locale }}/index.md_ may contain locale-specific data, extending the main data.


### Features

* Theater vk/fb publics
* Theater sites (with refs)
	* spektakli-online
	* grandballets.ru
* Specktackle videos
*