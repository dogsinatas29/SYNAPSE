# 🔭 Node Observation Results

## 🟢 VS Code (TS) (Total: 7103)
### fanIn Top 10 (수렴 코어)
| Node (File) | fanIn | fanOut |
|---|---|---|
| `...vscode/vscode-main/src/vs/base/common/` **`lifecycle.ts`** | 2952 | 7 |
| `...vscode/vscode-main/src/vs/base/common/` **`uri.ts`** | 2229 | 4 |
| `...vscode/vscode-main/src/vs/base/common/` **`event.ts`** | 1828 | 11 |
| `...inatas/다운로드/vscode/vscode-main/src/vs/` **`nls.ts`** | 1795 | 0 |
| `.../src/vs/platform/instantiation/common/` **`instantiation.ts`** | 1710 | 3 |
| `...e/vscode-main/src/vs/base/test/common/` **`utils.ts`** | 1240 | 4 |
| `...scode-main/src/vs/platform/log/common/` **`log.ts`** | 1164 | 14 |
| `.../src/vs/platform/configuration/common/` **`configuration.ts`** | 1049 | 7 |
| `...vscode/vscode-main/src/vs/base/common/` **`cancellation.ts`** | 945 | 2 |
| `...ain/src/vs/platform/contextkey/common/` **`contextkey.ts`** | 915 | 9 |

### fanOut Top 10 (발산 코어)
| Node (File) | fanIn | fanOut |
|---|---|---|
| `...Host/node/codex/protocol/generated/v2/` **`index.ts`** | 1 | 503 |
| `...로드/vscode/vscode-main/src/vs/sessions/` **`sessions.common.main.ts`** | 2 | 270 |
| `...드/vscode/vscode-main/src/vs/workbench/` **`workbench.common.main.ts`** | 2 | 253 |
| `...src/vs/workbench/contrib/chat/browser/` **`chat.shared.contribution.ts`** | 2 | 203 |
| `...de-main/src/vs/workbench/test/browser/` **`workbenchTestServices.ts`** | 170 | 189 |
| `...vscode-main/src/vs/code/electron-main/` **`app.ts`** | 1 | 141 |
| `...s/code/electron-utility/sharedProcess/` **`sharedProcessMain.ts`** | 0 | 141 |
| `...nch/contrib/chat/browser/widget/input/` **`chatInputPart.ts`** | 5 | 139 |
| `...vs/workbench/contrib/notebook/browser/` **`notebook.contribution.ts`** | 2 | 123 |
| `...code-main/src/vs/workbench/api/common/` **`extHost.api.impl.ts`** | 3 | 121 |

### Top 0.1% Overlap Nodes (교집합: 0/7)
> 텅 빔 (0.00%) - 완벽하게 분리됨.

## 🟢 Linux (C) (Total: 51930)
### fanIn Top 10 (수렴 코어)
| Node (File) | fanIn | fanOut |
|---|---|---|
| `...로드/linux-7.2-rc3/arch/x86/include/asm/` **`io.h`** | 946 | 5 |
| `...로드/linux-7.2-rc3/arch/x86/include/asm/` **`page.h`** | 555 | 3 |
| `...로드/linux-7.2-rc3/arch/x86/include/asm/` **`cacheflush.h`** | 476 | 1 |
| `...로드/linux-7.2-rc3/arch/x86/include/asm/` **`irq.h`** | 457 | 2 |
| `...로드/linux-7.2-rc3/arch/x86/include/asm/` **`processor.h`** | 414 | 19 |
| `...로드/linux-7.2-rc3/arch/x86/include/asm/` **`setup.h`** | 397 | 6 |
| `...nux-7.2-rc3/arch/x86/include/uapi/asm/` **`byteorder.h`** | 392 | 0 |
| `...로드/linux-7.2-rc3/arch/x86/include/asm/` **`ptrace.h`** | 323 | 5 |
| `...ux-7.2-rc3/drivers/gpu/drm/amd/amdgpu/` **`amdgpu.h`** | 315 | 57 |
| `...로드/linux-7.2-rc3/arch/x86/include/asm/` **`sections.h`** | 283 | 1 |

### fanOut Top 10 (발산 코어)
| Node (File) | fanIn | fanOut |
|---|---|---|
| `...el/habanalabs/include/gaudi2/asic_reg/` **`gaudi2_regs.h`** | 0 | 158 |
| `...ccel/habanalabs/include/goya/asic_reg/` **`goya_regs.h`** | 1 | 96 |
| `...ux-7.2-rc3/drivers/gpu/drm/amd/amdgpu/` **`amdgpu_discovery.c`** | 0 | 94 |
| `...cel/habanalabs/include/gaudi/asic_reg/` **`gaudi_regs.h`** | 1 | 91 |
| `...-7.2-rc3/drivers/gpu/drm/i915/display/` **`intel_display.c`** | 0 | 83 |
| `...로드/linux-7.2-rc3/drivers/gpu/drm/i915/` **`i915_driver.c`** | 0 | 74 |
| `...natas/다운로드/linux-7.2-rc3/rust/helpers/` **`helpers.c`** | 0 | 62 |
| `...다운로드/linux-7.2-rc3/drivers/gpu/drm/xe/` **`xe_device.c`** | 0 | 59 |
| `...ux-7.2-rc3/drivers/gpu/drm/amd/amdgpu/` **`amdgpu.h`** | 315 | 57 |
| `...다운로드/linux-7.2-rc3/drivers/gpu/drm/xe/` **`xe_gt.c`** | 0 | 53 |

### Top 0.1% Overlap Nodes (교집합: 1/51)
| Node (File) | fanIn | fanOut |
|---|---|---|
| `...ux-7.2-rc3/drivers/gpu/drm/amd/amdgpu/` **`amdgpu.h`** | 315 | 57 |

## 🟢 RustDesk (Rust) (Total: 283)
### fanIn Top 10 (수렴 코어)
| Node (File) | fanIn | fanOut |
|---|---|---|
| `...e/dogsinatas/다운로드/rustdesk-master/src/` **`ipc.rs`** | 4 | 1 |
| `...e/dogsinatas/다운로드/rustdesk-master/src/` **`privacy_mode.rs`** | 2 | 0 |
| `...e/dogsinatas/다운로드/rustdesk-master/src/` **`keyboard.rs`** | 2 | 1 |
| `...e/dogsinatas/다운로드/rustdesk-master/src/` **`custom_server.rs`** | 2 | 0 |
| `...e/dogsinatas/다운로드/rustdesk-master/src/` **`flutter.rs`** | 2 | 0 |
| `...e/dogsinatas/다운로드/rustdesk-master/src/` **`port_forward_mux.rs`** | 2 | 0 |
| `...tas/다운로드/rustdesk-master/src/platform/` **`mod.rs`** | 2 | 6 |
| `...tas/다운로드/rustdesk-master/src/platform/` **`win_device.rs`** | 2 | 0 |
| `...natas/다운로드/rustdesk-master/src/server/` **`display_service.rs`** | 2 | 0 |
| `...드/rustdesk-master/libs/scrap/src/dxgi/` **`mod.rs`** | 2 | 2 |

### fanOut Top 10 (발산 코어)
| Node (File) | fanIn | fanOut |
|---|---|---|
| `...e/dogsinatas/다운로드/rustdesk-master/src/` **`lib.rs`** | 0 | 30 |
| `...rustdesk-master/libs/scrap/src/common/` **`mod.rs`** | 1 | 10 |
| `...tas/다운로드/rustdesk-master/src/platform/` **`mod.rs`** | 2 | 6 |
| `...s/다운로드/rustdesk-master/src/whiteboard/` **`mod.rs`** | 1 | 6 |
| `...s/다운로드/rustdesk-master/libs/scrap/src/` **`lib.rs`** | 0 | 6 |
| `...as/다운로드/rustdesk-master/libs/base/src/` **`lib.rs`** | 0 | 5 |
| `...ster/libs/clipboard/src/platform/unix/` **`mod.rs`** | 1 | 5 |
| `...로드/rustdesk-master/libs/scrap/src/x11/` **`mod.rs`** | 2 | 5 |
| `...rustdesk-master/libs/scrap/src/quartz/` **`mod.rs`** | 2 | 5 |
| `...-master/libs/remote_printer/src/setup/` **`mod.rs`** | 1 | 4 |

### Top 0.1% Overlap Nodes (교집합: 0/1)
> 텅 빔 (0.00%) - 완벽하게 분리됨.

## 🟢 Godot (C++) (Total: 3698)
### fanIn Top 10 (수렴 코어)
| Node (File) | fanIn | fanOut |
|---|---|---|
| `...sinatas/다운로드/godot-master/core/object/` **`class_db.h`** | 767 | 7 |
| `...sinatas/다운로드/godot-master/core/object/` **`callable_mp.h`** | 451 | 3 |
| `...sinatas/다운로드/godot-master/core/config/` **`project_settings.h`** | 310 | 3 |
| `.../dogsinatas/다운로드/godot-master/core/os/` **`os.h`** | 276 | 8 |
| `...sinatas/다운로드/godot-master/core/config/` **`engine.h`** | 249 | 3 |
| `...e/dogsinatas/다운로드/godot-master/editor/` **`editor_node.h`** | 222 | 7 |
| `...tas/다운로드/godot-master/editor/settings/` **`editor_settings.h`** | 211 | 4 |
| `...s/다운로드/godot-master/servers/rendering/` **`rendering_server.h`** | 202 | 8 |
| `/home/dogsinatas/다운로드/godot-master/tests/` **`test_macros.h`** | 194 | 2 |
| `...gsinatas/다운로드/godot-master/scene/main/` **`scene_tree.h`** | 189 | 7 |

### fanOut Top 10 (발산 코어)
| Node (File) | fanIn | fanOut |
|---|---|---|
| `/home/dogsinatas/다운로드/godot-master/scene/` **`register_scene_types.cpp`** | 0 | 310 |
| `...e/dogsinatas/다운로드/godot-master/editor/` **`editor_node.cpp`** | 0 | 162 |
| `...e/dogsinatas/다운로드/godot-master/editor/` **`register_editor_types.cpp`** | 0 | 109 |
| `/home/dogsinatas/다운로드/godot-master/main/` **`main.cpp`** | 0 | 80 |
| `...tas/다운로드/godot-master/editor/scene/3d/` **`node_3d_editor_plugin.cpp`** | 0 | 78 |
| `.../dogsinatas/다운로드/godot-master/servers/` **`register_server_types.cpp`** | 0 | 75 |
| `/home/dogsinatas/다운로드/godot-master/core/` **`register_core_types.cpp`** | 0 | 61 |
| `...atas/다운로드/godot-master/modules/openxr/` **`register_types.cpp`** | 0 | 59 |
| `...natas/다운로드/godot-master/editor/script/` **`script_editor_plugin.cpp`** | 0 | 53 |
| `...inatas/다운로드/godot-master/editor/scene/` **`canvas_item_editor_plugin.cpp`** | 0 | 52 |

### Top 0.1% Overlap Nodes (교집합: 0/3)
> 텅 빔 (0.00%) - 완벽하게 분리됨.

## 🟢 AntennaPod (Java) (Total: 624)
### fanIn Top 10 (수렴 코어)
| Node (File) | fanIn | fanOut |
|---|---|---|
| `.../java/de/danoeh/antennapod/model/feed/` **`FeedItem.java`** | 120 | 0 |
| `.../java/de/danoeh/antennapod/model/feed/` **`Feed.java`** | 115 | 0 |
| `...danoeh/antennapod/storage/preferences/` **`UserPreferences.java`** | 102 | 6 |
| `.../java/de/danoeh/antennapod/model/feed/` **`FeedMedia.java`** | 95 | 4 |
| `...de/danoeh/antennapod/storage/database/` **`DBReader.java`** | 79 | 15 |
| `...de/danoeh/antennapod/storage/database/` **`DBWriter.java`** | 53 | 22 |
| `.../java/de/danoeh/antennapod/model/feed/` **`FeedItemFilter.java`** | 51 | 0 |
| `...a/de/danoeh/antennapod/model/playback/` **`Playable.java`** | 40 | 1 |
| `...in/java/de/danoeh/antennapod/activity/` **`MainActivity.java`** | 36 | 47 |
| `.../java/de/danoeh/antennapod/model/feed/` **`SortOrder.java`** | 33 | 0 |

### fanOut Top 10 (발산 코어)
| Node (File) | fanIn | fanOut |
|---|---|---|
| `...in/java/de/danoeh/antennapod/activity/` **`MainActivity.java`** | 36 | 47 |
| `...de/danoeh/antennapod/playback/service/` **`PlaybackService.java`** | 14 | 46 |
| `...a/de/danoeh/antennapod/ui/screen/feed/` **`FeedItemlistFragment.java`** | 8 | 40 |
| `...de/danoeh/antennapod/playback/service/` **`Media3PlaybackService.java`** | 1 | 37 |
| `...h/antennapod/ui/screen/playback/audio/` **`AudioPlayerFragment.java`** | 1 | 35 |
| `...e/danoeh/antennapod/ui/screen/episode/` **`ItemFragment.java`** | 0 | 34 |
| `.../de/danoeh/antennapod/ui/screen/queue/` **`QueueFragment.java`** | 9 | 32 |
| `...de/danoeh/antennapod/net/sync/service/` **`SyncService.java`** | 0 | 29 |
| `.../danoeh/antennapod/ui/screen/download/` **`CompletedDownloadsFragment.java`** | 7 | 29 |
| `...h/antennapod/ui/screen/playback/video/` **`VideoplayerActivity.java`** | 0 | 27 |

### Top 0.1% Overlap Nodes (교집합: 0/1)
> 텅 빔 (0.00%) - 완벽하게 분리됨.