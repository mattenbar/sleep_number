(function () {
  const cloudName = "doxfstysv";
  const galleryContainer = "#cloudinaryGallery";
  const sleepNumberAssetTag = "sleep-number";
  const sleepNumberAssetFolder = "Sleep Number";
  const sleepNumberAssetListUrl = `https://res.cloudinary.com/${cloudName}/image/list/${sleepNumberAssetTag}.json`;
  const recolorBaseAsset = {
    publicId: "True_Temp_Sheet-Set_PDP_Postcard_Gallery1_v8ezxy.jpg",
    prompt: "2 pillows behind;front top pillow;ice blue sheet;mattress bellow the pillows",
  };

  const knownSleepNumberAssets = [
    asset(
      "Essential_Fit_Cotton_Sheets_PDP_Postcard_Variant_Wheat_unp7td",
      "Wheat Essential Fit Cotton Sheets on bed, hero view",
      1782145097,
    ),
    asset(
      "Essential_Fit_Cotton_Sheets_PDP_Postcard_Gallery1_lktupv",
      "Essential Fit Cotton Sheets lifestyle gallery image",
      1782145097,
    ),
  ];

  const variants = {
    rose: {
      label: "Rose",
      tone: "Soft rose",
      swatch: "#835354",
      mediaSet: "Sleep Number / Rose",
      keywords: ["rose"],
    },
    olive: {
      label: "Olive",
      tone: "Muted green",
      swatch: "#879179",
      mediaSet: "Sleep Number / Olive",
      keywords: ["olive"],
    },
    navy: {
      label: "Navy",
      tone: "Deep blue",
      swatch: "#2D405E",
      mediaSet: "Sleep Number / Navy",
      keywords: ["navy"],
    },
    lightGray: {
      label: "Light Gray",
      tone: "Light neutral",
      swatch: "#939393",
      mediaSet: "Sleep Number / Light Gray",
      keywords: ["light gray", "light grey", "gray", "grey"],
    },
    wheat: {
      label: "Wheat",
      tone: "Warm neutral",
      swatch: "#9B8D89",
      mediaSet: "Sleep Number / Wheat",
      keywords: ["wheat"],
    },
  };

  let selectedVariant = "wheat";
  let galleryInstance = null;
  let fallbackIndex = 0;
  let sleepNumberAssets = knownSleepNumberAssets;
  let folderAssetUpdatedAt = null;
  let assetSource = "seeded public IDs";

  document.addEventListener("DOMContentLoaded", () => {
    renderSwatches();
    selectVariant(selectedVariant);
    loadSleepNumberAssets();
  });

  function asset(publicId, altText, version, options = {}) {
    return {
      publicId,
      mediaType: "image",
      altText,
      version,
      ...options,
    };
  }

  function renderSwatches() {
    const colorOptions = document.querySelector("#colorOptions");
    colorOptions.innerHTML = "";

    Object.entries(variants).forEach(([key, variant]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "swatch-button";
      button.dataset.variant = key;
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", String(key === selectedVariant));

      button.innerHTML = `
        <span class="swatch" style="background:${variant.swatch}"></span>
        <span class="swatch-copy">
          <strong>${variant.label}</strong>
          <span>${variant.tone}</span>
        </span>
      `;

      button.addEventListener("click", () => selectVariant(key));
      colorOptions.append(button);
    });
  }

  async function loadSleepNumberAssets() {
    try {
      const response = await fetch(sleepNumberAssetListUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Cloudinary asset list returned ${response.status}`);
      }

      const data = await response.json();
      const folderAssets = (data.resources || []).map(resourceToAsset).filter(Boolean);
      if (!folderAssets.length) {
        throw new Error(`No assets found for tag ${sleepNumberAssetTag}`);
      }

      sleepNumberAssets = folderAssets;
      folderAssetUpdatedAt = data.updated_at || null;
      assetSource = `public tag list: ${sleepNumberAssetTag}`;
      selectVariant(selectedVariant);
    } catch (error) {
      console.warn("Using seeded Sleep Number assets because the public list could not be loaded.", error);
      assetSource = "seeded public IDs";
      selectVariant(selectedVariant);
    }
  }

  function resourceToAsset(resource) {
    if (!resource || !resource.public_id) {
      return null;
    }

    return asset(
      resource.public_id,
      altFromPublicId(resource.public_id),
      resource.version,
    );
  }

  function selectVariant(key) {
    selectedVariant = key;
    fallbackIndex = 0;
    const variant = variants[key];
    const mediaAssets = resolveVariantMedia(variant);

    document.querySelector("#activeColor").textContent = variant.label;
    document.querySelector("#activeSet").textContent = variant.mediaSet;
    document.querySelector("#assetCount").textContent =
      `${mediaAssets.length} images from ${sleepNumberAssetFolder}`;
    renderPayload(variant, mediaAssets);
    updateSelectedSwatch();

    if (window.cloudinary && typeof window.cloudinary.galleryWidget === "function") {
      renderCloudinaryGallery(mediaAssets);
      return;
    }

    renderFallbackGallery(variant, mediaAssets);
    setStatus("Fallback", "fallback");
  }

  function resolveVariantMedia(variant) {
    const generatedRecolorAsset = createRecolorAsset(variant);
    const colorMatches = sleepNumberAssets.filter((media) =>
      variant.keywords.some((keyword) => includesKeyword(media.publicId, keyword)),
    );
    const genericAssets = sleepNumberAssets.filter((media) =>
      includesKeyword(media.publicId, "gallery"),
    );
    const selectedAssets = colorMatches.length
      ? [...colorMatches, ...genericAssets]
      : genericAssets;

    return uniqueAssets([
      generatedRecolorAsset,
      ...(selectedAssets.length ? selectedAssets : sleepNumberAssets),
    ]);
  }

  function createRecolorAsset(variant) {
    const targetColor = variant.swatch.replace("#", "").toUpperCase();
    const rawTransformation =
      `e_gen_recolor:prompt_(${encodedRecolorPrompt()});to-color_rgb:${targetColor}`;
    const transformation = {
      raw_transformation: rawTransformation,
      prefixed: false,
    };

    return asset(
      recolorBaseAsset.publicId,
      `${variant.label} generated recolor of True Temp Sheet Set`,
      null,
      {
        transformation,
        thumbnailTransformation: transformation,
        deliveryUrl: buildRecolorUrl(rawTransformation),
      },
    );
  }

  function renderCloudinaryGallery(mediaAssets) {
    const config = {
      cloudName,
      container: galleryContainer,
      mediaAssets,
      displayProps: {
        spacing: 15,
      },
      bgColor: "transparent",
      carouselStyle: "thumbnails",
      carouselLocation: "bottom",
      carouselOffset: 10,
      navigation: "always",
      thumbnailProps: {
        mediaSymbolSize: 42,
        spacing: 20,
        width: 90,
        height: 90,
        navigationFloat: true,
        navigationShape: "round",
        navigationSize: 40,
        navigationColor: "#ffffff",
        selectedStyle: "gradient",
        selectedBorderPosition: "bottom",
        selectedBorderWidth: 4,
        navigationIconColor: "#000000",
      },
      navigationButtonProps: {
        iconColor: "#000000",
        color: "#000",
        size: 52,
        navigationPosition: "offset",
        navigationOffset: 12,
      },
      themeProps: {
        primary: "#000000",
        active: "#777777",
      },
      zoomProps: {
        trigger: "hover",
      },
    };

    try {
      document.querySelector("#fallbackGallery").hidden = true;
      document.querySelector("#cloudinaryGallery").hidden = false;

      if (!galleryInstance) {
        galleryInstance = window.cloudinary.galleryWidget(config);
        galleryInstance.render();
        registerGalleryEvents(galleryInstance);
      } else {
        galleryInstance.update({ mediaAssets });
        if (typeof galleryInstance.setItem === "function") {
          galleryInstance.setItem(0);
        }
      }

      setStatus("Widget active", "");
    } catch (error) {
      console.warn("Cloudinary Product Gallery failed, rendering static fallback.", error);
      renderFallbackGallery(variants[selectedVariant], mediaAssets);
      setStatus("Fallback", "fallback");
    }
  }

  function registerGalleryEvents(instance) {
    if (!instance || typeof instance.on !== "function") {
      return;
    }

    ["thumbclick", "viewernext", "viewerprev", "zoomin", "zoomout"].forEach((eventName) => {
      instance.on(eventName, (event) => {
        if (!event || !event.label) {
          return;
        }

        const variant = variants[selectedVariant];
        const payload = buildVariantPayload(variant, resolveVariantMedia(variant));
        payload.lastGalleryEvent = {
          type: eventName,
          asset: event.label,
        };
        document.querySelector("#variantPayload").textContent = JSON.stringify(payload, null, 2);
      });
    });
  }

  function renderFallbackGallery(variant, mediaAssets) {
    const fallback = document.querySelector("#fallbackGallery");
    const activeAsset = mediaAssets[fallbackIndex];

    document.querySelector("#cloudinaryGallery").hidden = true;
    fallback.hidden = false;
    fallback.innerHTML = `
      <div class="fallback-thumbs" role="listbox" aria-label="${variant.label} media">
        ${mediaAssets
          .map(
            (media, index) => `
              <button
                type="button"
                class="fallback-thumb"
                data-index="${index}"
                aria-selected="${index === fallbackIndex}"
                aria-label="${media.altText}"
              >
                <img src="${imageUrl(media, 240)}" alt="" />
              </button>
            `,
          )
          .join("")}
      </div>
      <div class="fallback-main">
        <img src="${imageUrl(activeAsset, 1200)}" alt="${activeAsset.altText}" />
      </div>
    `;

    fallback.querySelectorAll(".fallback-thumb").forEach((button) => {
      button.addEventListener("click", () => {
        fallbackIndex = Number(button.dataset.index);
        renderFallbackGallery(variant, mediaAssets);
      });
    });
  }

  function renderPayload(variant, mediaAssets) {
    document.querySelector("#variantPayload").textContent = JSON.stringify(
      buildVariantPayload(variant, mediaAssets),
      null,
      2,
    );
  }

  function buildVariantPayload(variant, mediaAssets) {
    return {
      selectedVariant: variant.mediaSet,
      cloudName,
      sourceTag: sleepNumberAssetTag,
      assetFolder: sleepNumberAssetFolder,
      assetSource,
      assetListUrl: sleepNumberAssetListUrl,
      assetListUpdatedAt: folderAssetUpdatedAt,
      variantKeywords: variant.keywords,
      updateCall: "gallery.update({ mediaAssets })",
      mediaAssets,
    };
  }

  function updateSelectedSwatch() {
    document.querySelectorAll(".swatch-button").forEach((button) => {
      button.setAttribute("aria-checked", String(button.dataset.variant === selectedVariant));
    });
  }

  function uniqueAssets(mediaAssets) {
    const seen = new Set();
    return mediaAssets.filter((media) => {
      const key = `${media.publicId}:${media.transformation?.raw_transformation || ""}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  function includesKeyword(value, keyword) {
    return normalize(value).includes(normalize(keyword));
  }

  function normalize(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ");
  }

  function altFromPublicId(publicId) {
    return publicId
      .split("/")
      .pop()
      .replace(/_[a-z0-9]{6,}$/i, "")
      .replace(/[_-]+/g, " ")
      .trim();
  }

  function setStatus(label, state) {
    const status = document.querySelector("#galleryStatus");
    status.textContent = label;
    status.className = `status-pill${state ? ` ${state}` : ""}`;
  }

  function imageUrl(media, width) {
    if (media.deliveryUrl) {
      return media.deliveryUrl;
    }

    const encodedPublicId = media.publicId.split("/").map(encodeURIComponent).join("/");
    const asset = sleepNumberAssets.find((item) => item.publicId === media.publicId) || media;
    const versionPath = asset && asset.version ? `v${asset.version}/` : "";
    const transformations = [`f_auto,q_auto,w_${width},c_fill,g_auto`];

    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations.join("/")}/${versionPath}${encodedPublicId}`;
  }

  function buildRecolorUrl(rawTransformation) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${rawTransformation}/${recolorBaseAsset.publicId}`;
  }

  function encodedRecolorPrompt() {
    return recolorBaseAsset.prompt.replaceAll(" ", "%20");
  }
})();
