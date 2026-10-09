const CELL_WIDTH = 192;
const CELL_HEIGHT = 208;
// Formal fallback shares the originals' stage, body height and floor.
const PUBLISHED_RENDER_BOXES = {"hibiki":[{"x":71.32948,"y":74.797688,"width":377.34104,"height":408.786127},{"x":72.413793,"y":75.057471,"width":375.172414,"height":406.436782},{"x":71.32948,"y":72.83237,"width":377.34104,"height":408.786127},{"x":70.232558,"y":72.55814,"width":379.534884,"height":411.162791},{"x":63.373494,"y":56.506024,"width":393.253012,"height":426.024096},{"x":70.232558,"y":72.55814,"width":379.534884,"height":411.162791},{"x":71.32948,"y":72.83237,"width":377.34104,"height":408.786127},{"x":69.122807,"y":68.304094,"width":381.754386,"height":413.567251},{"x":72.413793,"y":75.057471,"width":375.172414,"height":406.436782},{"x":69.122807,"y":70.292398,"width":381.754386,"height":413.567251},{"x":70.232558,"y":72.55814,"width":379.534884,"height":411.162791}],"toki":[{"x":80.659341,"y":82.637363,"width":358.681319,"height":388.571429},{"x":85.454545,"y":92.727273,"width":349.090909,"height":378.181818},{"x":84.043127,"y":89.757412,"width":351.913747,"height":381.239892},{"x":80.659341,"y":82.637363,"width":358.681319,"height":388.571429},{"x":84.516129,"y":90.752688,"width":350.967742,"height":380.215054},{"x":79.668508,"y":80.552486,"width":360.662983,"height":390.718232},{"x":84.516129,"y":90.752688,"width":350.967742,"height":380.215054},{"x":81.639344,"y":84.699454,"width":356.721311,"height":386.448087},{"x":86.382979,"y":94.680851,"width":347.234043,"height":376.170213},{"x":86.382979,"y":94.680851,"width":347.234043,"height":376.170213},{"x":92.615385,"y":107.794872,"width":334.769231,"height":362.666667}]};
const FRAME_COUNTS = Object.freeze([6, 8, 8, 4, 5, 8, 6, 6, 6, 8, 8]);
const STATES = Object.freeze([
  'idle', 'running-right', 'running-left', 'waving', 'jumping',
  'failed', 'waiting', 'running', 'review',
]);
const INTERVALS = Object.freeze({
  idle: 220, 'running-right': 150, 'running-left': 150, waving: 190,
  jumping: 190, failed: 200, waiting: 240, running: 190, review: 220,
});
const SLUGS = Object.freeze({
  hibiki: 'hibiki-cheerleader-fullbody-handdrawn',
  toki: 'toki-bunny-fullbody-handdrawn',
});
const imageLoads = new Map();
const metadataLoads = new Map();
const hdRowLoads = new Map();
const hdManifestUrl = new URL('assets/motion-hd/manifest.json?v=3', import.meta.url);
let hdManifestLoad;

function requirePet(pet) {
  if (!Object.hasOwn(SLUGS, pet)) throw new TypeError(`Unknown pet: ${pet}`);
}

function requireState(state) {
  if (!STATES.includes(state)) throw new TypeError(`Unknown pet state: ${state}`);
}

function loadSpritesheet(pet) {
  if (!imageLoads.has(pet)) {
    const pending = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        if (image.naturalWidth !== 1536 || image.naturalHeight !== 2288) {
          reject(new Error(`${pet}: unexpected sprite dimensions`));
          return;
        }
        resolve(image);
      };
      image.onerror = () => reject(new Error(`${pet}: the sprite image could not load`));
      image.src = new URL(`assets/${pet}-spritesheet.png`, import.meta.url).href;
    });
    imageLoads.set(pet, pending);
    pending.catch(() => imageLoads.delete(pet));
  }
  return imageLoads.get(pet);
}

function positiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function loadHDManifest() {
  if (!hdManifestLoad) {
    hdManifestLoad = fetch(hdManifestUrl.href, { cache: 'no-cache' }).then((response) => {
      if (!response.ok) throw new Error('The original animation manifest could not load');
      return response.json();
    }).then((manifest) => {
      if (manifest?.schema_version !== 1 || !manifest.pets) {
        throw new Error('The original animation manifest has an unexpected format');
      }
      return manifest;
    });
  }
  return hdManifestLoad;
}

function loadHDRow(pet, row) {
  const key = `${pet}:${row}`;
  if (!hdRowLoads.has(key)) {
    const pending = loadHDManifest().then((manifest) => {
      const family = manifest.pets[pet];
      const definition = family?.rows?.find((entry) => entry.row === row);
      if (!positiveInteger(family?.stage_width) || !positiveInteger(family?.stage_height) ||
        !definition || typeof definition.file !== 'string' ||
        definition.frame_count !== FRAME_COUNTS[row]) {
        throw new Error(`${pet}: the original animation row is unavailable`);
      }
      const explicitFrames = Array.isArray(definition.frames);
      if (!explicitFrames && (!positiveInteger(definition.frame_width) || !positiveInteger(definition.frame_height))) {
        throw new Error(`${pet}: the original animation grid is invalid`);
      }
      const scale = definition.scale ?? 1;
      if (!Number.isFinite(scale) || scale <= 0 || scale > 1) {
        throw new Error(`${pet}: original animation source pixels cannot be enlarged`);
      }
      const rawFrames = definition.frames ?? Array.from({ length: definition.frame_count }, (_, column) => ({
        x: column * definition.frame_width, y: 0, width: definition.frame_width, height: definition.frame_height,
        draw_x: 0, draw_y: 0,
      }));
      const frames = rawFrames.map((frame) => ({
        ...frame, draw_width: frame.draw_width ?? frame.width * scale,
        draw_height: frame.draw_height ?? frame.height * scale,
      }));
      if (frames.length !== definition.frame_count || frames.some((frame) =>
        ![frame.x, frame.y, frame.width, frame.height, frame.draw_x, frame.draw_y,
          frame.draw_width, frame.draw_height].every(Number.isFinite) ||
        frame.x < 0 || frame.y < 0 || !positiveInteger(frame.width) || !positiveInteger(frame.height) ||
        frame.draw_width <= 0 || frame.draw_height <= 0 ||
        frame.draw_width > frame.width || frame.draw_height > frame.height ||
        Math.abs(frame.draw_width / frame.width - frame.draw_height / frame.height) > 0.005 ||
        Math.abs(frame.draw_width / frame.width - frames[0].draw_width / frames[0].width) > 0.005 ||
        frame.draw_x >= family.stage_width || frame.draw_y >= family.stage_height ||
        frame.draw_x + frame.draw_width <= 0 || frame.draw_y + frame.draw_height <= 0)) {
        throw new Error(`${pet}: the original animation registration is invalid`);
      }
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          const expectedWidth = definition.source_width ?? (explicitFrames ? null : definition.frame_width * definition.frame_count);
          const expectedHeight = definition.source_height ?? (explicitFrames ? null : definition.frame_height);
          if ((expectedWidth !== null && image.naturalWidth !== expectedWidth) ||
            (expectedHeight !== null && image.naturalHeight !== expectedHeight) || frames.some((frame) =>
              frame.x + frame.width > image.naturalWidth || frame.y + frame.height > image.naturalHeight)) {
            reject(new Error(`${pet}: the original animation pixels do not match the manifest`));
            return;
          }
          resolve({ image, frames, width: family.stage_width, height: family.stage_height });
        };
        image.onerror = () => reject(new Error(`${pet}: the original animation image could not load`));
        image.decoding = 'async';
        const url = new URL(definition.file, hdManifestUrl);
        if (typeof definition.sha256 === 'string') url.searchParams.set('v', definition.sha256.slice(0, 16));
        image.src = url.href;
      });
    });
    hdRowLoads.set(key, pending);
  }
  return hdRowLoads.get(key);
}

/** Plays original transparent animation strips, with the published v2 atlas as fallback. */
export class PetPlayer {
  constructor(element, { pet, state = 'idle', paused } = {}) {
    requirePet(pet);
    requireState(state);
    if (!element || typeof element.getContext !== 'function') {
      throw new TypeError('PetPlayer requires a canvas element');
    }
    const context = element.getContext('2d');
    if (!context) throw new Error('Canvas rendering is unavailable');

    this.canvas = element;
    this.pet = pet;
    this.error = null;
    this._context = context;
    this._image = null;
    this._hdRows = new Map();
    this._base = { state, frame: 0 };
    this._response = null;
    this._timer = null;
    this._destroyed = false;
    this._pauseOverride = typeof paused === 'boolean' ? paused : undefined;
    this._motion = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    this._paused = this._pauseOverride ?? this._motion?.matches ?? false;
    this._onMotionChange = () => {
      if (this._pauseOverride === undefined) this._applyPaused(this._motion.matches);
    };
    this._motion?.addEventListener('change', this._onMotionChange);

    element.width = 520;
    element.height = 520;
    element.dataset.petStatus = 'loading';
    this._context.imageSmoothingEnabled = false;

    this.ready = Promise.all([
      loadSpritesheet(pet), this._ensureHDRow(STATES.indexOf(state)),
    ]).then(([image]) => {
      if (this._destroyed) return this;
      this._image = image;
      element.dataset.petStatus = 'ready';
      this._draw();
      this._schedule();
      this._emit('pet-player-ready');
      return this;
    }).catch((error) => {
      this.error = error;
      if (!this._destroyed) {
        element.dataset.petStatus = 'error';
        this._cancelResponse();
        this._emit('pet-player-error', { error });
      }
      throw error;
    });
    // Pages can read `ready` or the error event; an unused player is also safe.
    this.ready.catch(() => {});
  }

  get paused() { return this._paused; }
  get state() { return this._response?.state ?? this._base.state ?? null; }
  get direction() { return this._response ? null : this._base.direction ?? null; }

  /** Prepare the complete turn before an interaction traverses both strips. */
  async prepareDirections() {
    this._assertActive();
    await this.ready;
    if (!this._destroyed) await Promise.all([this._ensureHDRow(9), this._ensureHDRow(10)]);
    return this;
  }

  setState(state) {
    this._assertActive();
    requireState(state);
    this._cancelResponse();
    this._base = { state, frame: 0 };
    this._refresh();
    return this;
  }

  /** Index 0 is up; each subsequent index turns clockwise by 22.5 degrees. */
  setDirection(index) {
    this._assertActive();
    if (!Number.isInteger(index) || index < 0 || index > 15) {
      throw new RangeError('Direction must be an integer from 0 to 15');
    }
    this._cancelResponse();
    this._base = { direction: index, frame: 0 };
    this._refresh();
    return this;
  }

  setPaused(paused) {
    this._assertActive();
    if (typeof paused !== 'boolean') throw new TypeError('Paused must be a boolean');
    this._pauseOverride = paused;
    this._applyPaused(paused);
    return this;
  }

  /** The latest response replaces any previous one and restores the chosen base. */
  async respond(state = 'waving') {
    this._assertActive();
    requireState(state);
    this._cancelResponse();
    let finish;
    const complete = new Promise((resolve) => { finish = resolve; });
    const response = { state, frame: 0, finish };
    this._response = response;
    this._clearTimer();
    try {
      await this.ready;
    } catch (error) {
      if (this._response === response) this._cancelResponse();
      return { completed: false, cancelled: false, error };
    }
    if (this._destroyed || this._response !== response) return complete;
    this._refresh();
    return complete;
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._clearTimer();
    this._cancelResponse();
    this._motion?.removeEventListener('change', this._onMotionChange);
    this._image = null;
    this._hdRows.clear();
    this.canvas.dataset.petStatus = 'destroyed';
  }

  _assertActive() {
    if (this._destroyed) throw new Error('This PetPlayer has been destroyed');
  }

  _applyPaused(paused) {
    this._paused = paused;
    this._refresh();
    this._emit('pet-player-change');
  }

  _cancelResponse() {
    if (!this._response) return;
    const previous = this._response;
    this._response = null;
    previous.finish({ completed: false, cancelled: true });
  }

  _refresh() {
    this._clearTimer();
    this._ensureHDRow(this._currentRow());
    this._draw();
    this._schedule();
  }

  _currentRow() {
    const mode = this._response ?? this._base;
    return mode.direction === undefined ? STATES.indexOf(mode.state) : 9 + Math.floor(mode.direction / 8);
  }

  _ensureHDRow(row) {
    if (!this._hdRows.has(row)) {
      const asset = { loading: true, value: null, promise: null };
      this._hdRows.set(row, asset);
      asset.promise = loadHDRow(this.pet, row).then((value) => { asset.value = value; }, () => {
        // Optional original strips may fail independently. The formal atlas remains usable.
        asset.value = null;
      }).then(() => {
        asset.loading = false;
        if (this._image && !this._destroyed && this._currentRow() === row) this._refresh();
        return asset.value;
      });
    }
    return this._hdRows.get(row).promise;
  }

  _clearTimer() {
    if (this._timer !== null) window.clearTimeout(this._timer);
    this._timer = null;
  }

  _schedule() {
    const mode = this._response ?? this._base;
    if (this._destroyed || !this._image || this._paused || mode.direction !== undefined ||
      this._hdRows.get(this._currentRow())?.loading) return;
    this._timer = window.setTimeout(() => {
      this._timer = null;
      const current = this._response ?? this._base;
      const row = STATES.indexOf(current.state);
      if (this._response && current.frame + 1 === FRAME_COUNTS[row]) {
        const response = this._response;
        this._response = null;
        this._base.frame = 0;
        this._draw();
        response.finish({ completed: true, cancelled: false });
      } else {
        current.frame = (current.frame + 1) % FRAME_COUNTS[row];
        this._draw();
      }
      this._schedule();
    }, INTERVALS[mode.state]);
  }

  _draw() {
    if (!this._image || this._destroyed) return;
    const mode = this._response ?? this._base;
    const direction = mode.direction;
    const row = direction === undefined ? STATES.indexOf(mode.state) : 9 + Math.floor(direction / 8);
    const column = direction === undefined ? mode.frame : direction % 8;
    // Keep the last rendered pose while its replacement is loading. A pending
    // original is not a failed original, and must not briefly show the small atlas.
    if (this._hdRows.get(row)?.loading) {
      this.canvas.setAttribute('aria-busy', 'true');
      return;
    }
    this.canvas.removeAttribute('aria-busy');
    const original = this._hdRows.get(row)?.value;
    const previousSource = this.canvas.dataset.petSource;
    const width = original?.width ?? 520;
    const height = original?.height ?? 520;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this._context.imageSmoothingEnabled = true;
    this._context.imageSmoothingQuality = 'high';
    this._context.clearRect(0, 0, width, height);
    if (original) {
      const frame = original.frames[column];
      // Source crops stay exact; a single row scale and shared stage retain real jump displacement.
      this._context.drawImage(original.image, frame.x, frame.y, frame.width, frame.height,
        frame.draw_x, frame.draw_y, frame.draw_width, frame.draw_height);
      this.canvas.dataset.petSource = 'original-hd';
    } else {
      const box = PUBLISHED_RENDER_BOXES[this.pet][row];
      this._context.drawImage(
        this._image, column * CELL_WIDTH, row * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT,
        box.x, box.y, box.width, box.height,
      );
      this.canvas.dataset.petSource = 'published-atlas';
    }
    if (this.canvas.dataset.petSource !== previousSource) {
      this._emit('pet-player-change', { source: this.canvas.dataset.petSource });
    }
  }

  _emit(type, detail = {}) {
    this.canvas.dispatchEvent(new CustomEvent(type, {
      detail: { pet: this.pet, paused: this.paused, state: this.state, direction: this.direction, ...detail },
    }));
  }
}

function resolveBaseUrl(baseUrl) {
  const base = new URL(baseUrl, document.baseURI);
  if (!['https:', 'http:'].includes(base.protocol)) {
    throw new Error('Installation instructions need an HTTP or HTTPS website URL');
  }
  return base;
}

function validateMetadata(metadata) {
  if (metadata?.schema_version !== 1 || !metadata.pets) {
    throw new Error('Installation metadata has an unexpected format');
  }
  for (const [pet, slug] of Object.entries(SLUGS)) {
    const entry = metadata.pets[pet];
    if (!entry || entry.slug !== slug || !entry.name || !entry.version ||
      entry.package_file !== `${slug}-portable.zip` ||
      entry.config_path !== `${slug}/pet.json` ||
      entry.readme_path !== `${slug}/README.md` ||
      entry.spritesheet_path !== `${slug}/spritesheet.png` ||
      entry.preserve_current_active_pet !== true ||
      !/^[a-f0-9]{64}$/.test(entry.package_sha256) ||
      !/^[a-f0-9]{64}$/.test(entry.spritesheet_sha256)) {
      throw new Error(`${pet}: installation metadata could not be verified`);
    }
    if (entry.release_url !== undefined) {
      const release = new URL(entry.release_url);
      const parts = release.pathname.split('/');
      if (release.protocol !== 'https:' || release.hostname !== 'github.com' ||
        release.username || release.password || release.search || release.hash ||
        parts.length !== 7 || parts.slice(1, 5).join('/') !== 'MIBXR/blue-archive-pets/releases/download' ||
        !parts[5] || parts[5] === 'latest' || parts[6] !== entry.package_file) {
        throw new Error(`${pet}: the fixed release download could not be verified`);
      }
    }
  }
  return metadata;
}

/** Loads the manifest from the same deployment base used by the ZIP links. */
export async function loadInstallMetadata({ baseUrl = document.baseURI } = {}) {
  const url = new URL('downloads/agent-install.json?v=4', resolveBaseUrl(baseUrl)).href;
  if (!metadataLoads.has(url)) {
    const pending = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`Installation information could not load (${response.status})`);
      return response.json();
    }).then(validateMetadata);
    metadataLoads.set(url, pending);
    pending.catch(() => metadataLoads.delete(url));
  }
  return metadataLoads.get(url);
}

/** Creates previewable instructions without touching the clipboard or installing. */
export function createInstallInstruction(metadata, pet, { activate = false, baseUrl = document.baseURI } = {}) {
  requirePet(pet);
  validateMetadata(metadata);
  if (typeof activate !== 'boolean') throw new TypeError('Activate must be a boolean');
  const entry = metadata.pets[pet];
  const packageUrl = entry.release_url ?? new URL(`downloads/${entry.package_file}`, resolveBaseUrl(baseUrl)).href;
  const mode = activate
    ? '安装后，在目标应用支持的界面或配置中将这只桌宠设为当前宠物，并核实实际启用结果；若应用不可用，请说明尚未启用及如何启用。'
    : '只安装这只桌宠，保持我当前使用的桌宠不变。';

  return `请帮我安装「${entry.name}」桌宠。素材已经制作完成，使用 Petdex 支持的 sprite v2 图集，请直接使用下面的正式安装包。

安装要求：${mode}
压缩包：${packageUrl}
压缩包 SHA-256：${entry.package_sha256}
正式 spritesheet.png SHA-256：${entry.spritesheet_sha256}
作品版本：${entry.version}；sprite v2；透明 PNG 1536×2288；单格 192×208。

请按以下步骤完成：
1. 先确定安装目标：优先采用我明确指定的应用，否则采用当前运行你的 Agent。若目标是 Codex，先确认目标客户端支持 sprite v2，读取实际 CODEX_HOME，安装到 $CODEX_HOME/pets/${entry.slug}/；未设置时使用 ~/.codex/pets/${entry.slug}/。若客户端仅支持 v1，保留原图并改用下面的 Petdex 目录。若是其他支持该桌宠格式的 Agent，先从其文档或实际配置确认它自己的宠物目录，再安装到该目录的 ${entry.slug}/。若没有适用的 Agent 或无法确认其支持的目录，安装到 Petdex 标准目录 ~/.petdex/pets/${entry.slug}/。将 ~ 展开为当前操作系统用户主目录（Windows 通常为 USERPROFILE），不要写入项目工作目录；报告最终绝对路径。文件安装不依赖 codex 命令存在。
2. 下载上述 ZIP，核对压缩包 SHA-256 后解压。读取包内 ${entry.readme_path} 与 ${entry.config_path}。Hibiki 的格式字段位于 sprite.version；Toki 的格式位于 sprite_sheet、format、dimensions 和 cell_dimensions。包内说明用于了解素材，安装目标与流程以本指令及目标应用当前规范为准。若缺少下载、校验或写入能力，请说明尚缺的环节。
3. 使用包内 ${entry.spritesheet_path}，核对其 SHA-256、透明 PNG、1536×2288 尺寸和 v2 帧布局。不要重绘、缩放、转换为 v1，也不要使用网页图片或预览 GIF 替代正式图集。
4. 检查目标目录或应用现有宠物列表。只有名称、格式、作品版本和素材校验值一致时才复用同一记录，避免重复添加；不能仅凭同名推定版本一致，也不要覆盖其他宠物。
5. 将 pet.json 与原始 spritesheet.png 安装到选定的 ${entry.slug}/ 目录内，不再额外嵌套同名文件夹。包内 pet.json 是作品元数据：保留原始元数据副本；直接安装到 Codex 或 Petdex 时，生成目标应用读取的 pet.json，使用 id="${entry.slug}"、displayName="${entry.name}"、description（从包内原始 description 原样读取）、spritesheetPath="spritesheet.png" 和 spriteVersionNumber=2。其他 Agent 按其已确认的配置格式适配。安装无需 ChatGPT Pets 云端上传工具。
6. ${mode}重新读取目标目录中的配置与图集哈希，若目标应用可用，再检查其宠物列表和启用状态。若采用 Petdex 目录，需要 Petdex Desktop 或兼容客户端打开；若客户端尚未运行或不支持 v2，应报告“文件已安装，尚未启用”。复制指令、下载成功及文件安装均不代表桌宠已经启用。

完成后告诉我：安装目标与绝对路径、安装了哪一款及版本、文件是否安装成功、是否设为当前宠物；若尚未完成，说明停在哪一步。`;
}

/** Returns the text even when clipboard access is denied; this does not install. */
export async function copyInstallInstruction(pet, { activate = false, baseUrl = document.baseURI } = {}) {
  let text = '';
  try {
    const metadata = await loadInstallMetadata({ baseUrl });
    text = createInstallInstruction(metadata, pet, { activate, baseUrl });
    if (!navigator.clipboard?.writeText) {
      return { copied: false, text, error: new Error('Clipboard access is unavailable') };
    }
    await navigator.clipboard.writeText(text);
    return { copied: true, text };
  } catch (error) {
    return { copied: false, text, error };
  }
}
