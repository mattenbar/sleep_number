# Sleep Number PDP Gallery Demo

Static PDP demo showing how a product selection can swap the Cloudinary Product Gallery media set.

## Run

Open `index.html` in a browser, or serve the directory over HTTP:

```sh
python3 -m http.server 5173
```

Then visit `http://localhost:5173`.

## Cloudinary asset registry

The variant mapping lives in `app.js`:

```js
const cloudName = "doxfstysv";
const sleepNumberAssetTag = "sleep-number";

const variants = {
  rose: {
    mediaSet: "Sleep Number / Rose",
    keywords: ["rose"],
  },
  wheat: {
    mediaSet: "Sleep Number / Wheat",
    keywords: ["wheat"],
  },
};
```

The demo uses Cloudinary cloud `doxfstysv` and loads the public asset list at:

```text
https://res.cloudinary.com/doxfstysv/image/list/sleep-number.json
```

That public list currently returns assets from `asset_folder: "Sleep Number"`. The account appears to use dynamic folders, so the folder name is not part of the delivery `public_id`; the demo uses the returned public IDs directly.

Each selected color also prepends a generated recolor asset based on:

```text
True_Temp_Sheet-Set_PDP_Postcard_Gallery1_v8ezxy
```

The Product Gallery asset receives a per-color transformation like:

```js
{
  publicId: "True_Temp_Sheet-Set_PDP_Postcard_Gallery1_v8ezxy.jpg",
  mediaType: "image",
  transformation: {
    raw_transformation: "e_gen_recolor:prompt_(2%20pillows%20behind;front%20top%20pillow;ice%20blue%20sheet;mattress%20bellow%20the%20pillows);to-color_rgb:233957",
    prefixed: false
  }
}
```

The selected swatch changes only the `to-color_rgb` target. The prompt stays fixed.

To add more color-specific image sets, upload the images to the Sleep Number folder, tag them with `sleep-number`, and include the color name in the public ID, for example:

```text
Essential_Fit_Cotton_Sheets_PDP_Postcard_Variant_Graphite
Essential_Fit_Cotton_Sheets_PDP_Postcard_Gallery_Graphite_1
```

If assets are tagged per product/color instead, a variant can use a tag asset directly:

```js
mediaAssets: [{ tag: "sleep-number-sheets-stone", mediaType: "image" }]
```

The PDP calls:

```js
galleryInstance.update({ mediaAssets });
```

That is the key behavior: product selectors update product data and swap the gallery media payload without replacing the page.
