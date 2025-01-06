# Contentful Utility Suite 1.x.x

[![npm version](https://badge.fury.io/js/nrc-next-carousel.svg)](https://www.npmjs.com/package/contentful-utility-suite)

Contentful Utility Suite is a CLI tool designed to simplify and streamline common tasks in Contentful. With this tool, you can migrate content, export content collections, and search for specific content across environments or aliases in your Contentful space.

If you just stumbled onto this package from Google, please find my [Medium article](https://medium.com/@nicholasrussellconsulting/my-contentful-migration-process-and-a-present-to-help-you-facilitate-it-b9ab07fabe06) on this package for more context.


## Features

  

### 1. Migrate Selected Content

Easily migrate specific content from one environment or alias to another.

  

### 2. Export Content Collections

Export a specific collection of content from a specified environment or alias for further analysis or backup.

  

- Exports will be created in the working directory.

- The exported collections will follow this format:

```json

{

	"collectionsKey": "pageCollection",

	"fields": [

		"name",

		"slug"

	]

}

```

-  `collectionsKey`: The GraphQL collection key of the content type being exported.

-  `fields`: An array of fields to include in the export. Add fields as needed.

  

The app will initialize with this `example.json` as a template.

  

### 3. Search All Content

Search all content in a specific environment or alias for a given search string.

**Notes:**
- Search strings are **case insensitive**

## Installation

  

To install the Contentful Utility Suite globally:

  

`npm install -g contentful-utility-suite`

  

## Usage

`contentful-utility-suite`


**Notes:**
- Make sure your API keys have the proper alias/environment permissions to perform these tasks.
- All imports and exports will be handled in the working directory (the directory in which the tool is being run).
- The config file is global. You will be prompted to create a config if you don't have one initialized.

## Support

If you would consider supporting me I would be very appreciative. At my highest subscription tier, I offer face-to-face support and bug prioritization. 

[![GitHub Sponsors](https://img.shields.io/badge/sponsor-GitHub-blue?logo=github)](https://github.com/sponsors/nlowen233)

For more general consulting related to Next.js/Vercel/React/TypeScript/Contentful, please don't hesitate to setup a free intro consultation on [my site](https://www.nicholasrussellconsulting.com/).

## License

This project is licensed under the **ISC License**.

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA, OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE, OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.


---

Though not as legally rigorous, when creating this CLI app, there were people renovating the upstairs apartment from 8:00AM-Midnight at various noise levels. These renovations included what sounded like hammering a tile floored and dragging around screeching furniture. As I said, this lasted from the early morning into the night with no regard for the peace of their neighbors. For these reasons, any parties involved in those renovations are hereby barred from using this application in any capacity without exception.