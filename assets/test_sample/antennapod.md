# 🔬 SYNAPSE Architecture Scan Report (EV-LIVE)
Generated: 2026-08-19T03:13:02.102Z

## 0. Analysis Subject (Layer -3)
- **Subject**: Module: app/src/main/java/de/danoeh/antennapod
- **Files**: 610
- **Internal Edges**: 309
- **Boundary Edges**: 1568

### Subject Fingerprint (Top Internal Domains)
- Module: app/src/main/java/de/danoeh/antennapod
- Module: model/src/main/java/de/danoeh/antennapod/model
- Module: app/src/androidTest/java/de/test/antennapod
- Module: event/src/main/java/de/danoeh/antennapod/event
- Module: ui/common/src/main/java/de/danoeh/antennapod/ui/common

## 1. Executive Summary
**Scan Context**: Sub-cluster Analysis
**Observation**: External Dependency Ratio = 5.1x
**Assessment**: Selected cluster depends heavily on modules outside the scan boundary.
**Implication**: This does not imply whole-project instability.

**Why High External Coupling?**
- **Boundary Edge Count**: 1568 / 309 (Internal)
- **Top 3 Contributors**: 상위 3개 파일(FeedItemlistFragment.java, ItemFragment.java, MainActivity.java)이 전체 Boundary Edge의 **5.0%** (78개)를 생성하고 있습니다.



**Cumulative Boundary Contribution**
- **Top 3**: 5.0% (78 edges)
- **Top 10**: 12.9% (203 edges)
- **Top 50**: 40.4% (634 edges)
- **Top 100**: 57.8% (907 edges)

**Audit Confidence**: 81%

Base Score                     70
Grammar Noise Filtered        +0
Assembly Point Classified      +5
Contract Hub Verified          +0
Ghost Ratio < 5%               +6
Unknown References             0
Final Score                   81

### Global Metrics
- **Entropy**: 12
- **Ghost Dependencies**: 519

### Dependency Sources Breakdown
**Ghost Dependencies (Scanner Issues)**
  - N/A

**External Dependencies (Architecture)**
  - N/A


## 2. Impact Files (Architectural Assessment)
### 1. app/src/main/java/de/danoeh/antennapod/ui/screen/feed/FeedItemlistFragment.java
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/feed/FeedItemlistFragment.java)

**Evidence (Observed Behavior)**
- Boundary Crossing: 28
- Blast Radius (Clusters): 20
- Fan-Out: 46
- Fan-In: 8

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- Fragment (1 edges - Type: EXTENDS)
- model/src/main/java/de/danoeh/antennapod/model/download/DownloadResult.java (1 edges - Type: INCLUDE)
- MaterialToolbar.OnMenuItemClickListener (1 edges - Type: IMPLEMENTS)
- ui/app-start-intent/src/main/java/de/danoeh/antennapod/ui/appstartintent/MainActivityStarter.java (1 edges - Type: INCLUDE)
- ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/FastBlurTransformation.java (1 edges - Type: INCLUDE)
- Completable (1 edges - Type: INCLUDE)
- model/src/main/java/de/danoeh/antennapod/model/feed/FeedItemFilter.java (1 edges - Type: INCLUDE)
- event/src/main/java/de/danoeh/antennapod/event/FeedUpdateRunningEvent.java (1 edges - Type: INCLUDE)
- event/src/main/java/de/danoeh/antennapod/event/QueueEvent.java (1 edges - Type: INCLUDE)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBWriter.java (1 edges - Type: INCLUDE)

### 2. app/src/main/java/de/danoeh/antennapod/ui/screen/episode/ItemFragment.java
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/episode/ItemFragment.java)

**Evidence (Observed Behavior)**
- Boundary Crossing: 26
- Blast Radius (Clusters): 21
- Fan-Out: 39
- Fan-In: 0

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/DateFormatter.java (1 edges - Type: INCLUDE)
- Fragment (1 edges - Type: EXTENDS)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBReader.java (1 edges - Type: INCLUDE)
- event/src/main/java/de/danoeh/antennapod/event/PlayerStatusEvent.java (1 edges - Type: INCLUDE)
- Observable (1 edges - Type: INCLUDE)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/ThemeUtils.java (1 edges - Type: INCLUDE)
- model/src/main/java/de/danoeh/antennapod/model/feed/FeedItem.java (1 edges - Type: INCLUDE)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/ClipboardUtils.java (1 edges - Type: INCLUDE)
- playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackController.java (1 edges - Type: INCLUDE)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/ImagePlaceholder.java (1 edges - Type: INCLUDE)

### 3. app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java)

**Evidence (Observed Behavior)**
- Boundary Crossing: 24
- Blast Radius (Clusters): 21
- Fan-Out: 45
- Fan-In: 16

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- event/src/main/java/de/danoeh/antennapod/event/StreamingConfirmationEvent.java (1 edges - Type: INCLUDE)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/ThemeUtils.java (1 edges - Type: INCLUDE)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/NavigationToolbarActivity.java (1 edges - Type: IMPLEMENTS)
- event/src/main/java/de/danoeh/antennapod/event/MessageEvent.java (1 edges - Type: INCLUDE)
- storage/preferences/src/main/java/de/danoeh/antennapod/storage/preferences/UserPreferences.java (1 edges - Type: INCLUDE)
- ui/app-start-intent/src/main/java/de/danoeh/antennapod/ui/appstartintent/MediaButtonStarter.java (1 edges - Type: INCLUDE)
- playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackServiceInterface.java (1 edges - Type: INCLUDE)
- storage/database-maintenance-service/src/main/java/de/danoeh/antennapod/storage/databasemaintenanceservice/DatabaseMaintenanceWorker.java (1 edges - Type: INCLUDE)
- ui/statistics/src/main/java/de/danoeh/antennapod/ui/statistics/StatisticsFragment.java (1 edges - Type: INCLUDE)
- ui/app-start-intent/src/main/java/de/danoeh/antennapod/ui/appstartintent/MainActivityStarter.java (1 edges - Type: INCLUDE)

### 4. app/src/main/java/de/danoeh/antennapod/ui/screen/onlinefeedview/OnlineFeedViewActivity.java
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/onlinefeedview/OnlineFeedViewActivity.java)

**Evidence (Observed Behavior)**
- Boundary Crossing: 23
- Blast Radius (Clusters): 17
- Fan-Out: 26
- Fan-In: 0

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- net/discovery/src/main/java/de/danoeh/antennapod/net/discovery/PodcastSearcherRegistry.java (1 edges - Type: INCLUDE)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBWriter.java (1 edges - Type: INCLUDE)
- event/src/main/java/de/danoeh/antennapod/event/MessageEvent.java (1 edges - Type: INCLUDE)
- parser/feed/src/main/java/de/danoeh/antennapod/parser/feed/FeedHandlerResult.java (1 edges - Type: INCLUDE)
- Maybe (1 edges - Type: INCLUDE)
- ui/app-start-intent/src/main/java/de/danoeh/antennapod/ui/appstartintent/MainActivityStarter.java (1 edges - Type: INCLUDE)
- model/src/main/java/de/danoeh/antennapod/model/feed/Feed.java (1 edges - Type: INCLUDE)
- net/discovery/src/main/java/de/danoeh/antennapod/net/discovery/FeedUrlNotFoundException.java (1 edges - Type: INCLUDE)
- Observable (1 edges - Type: INCLUDE)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/ThemeUtils.java (1 edges - Type: INCLUDE)

### 5. app/src/main/java/de/danoeh/antennapod/ui/screen/queue/QueueFragment.java
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/queue/QueueFragment.java)

**Evidence (Observed Behavior)**
- Boundary Crossing: 20
- Blast Radius (Clusters): 20
- Fan-Out: 34
- Fan-In: 7

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- event/src/main/java/de/danoeh/antennapod/event/QueueEvent.java (1 edges - Type: INCLUDE)
- Observable (1 edges - Type: INCLUDE)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBWriter.java (1 edges - Type: INCLUDE)
- Fragment (1 edges - Type: EXTENDS)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/ConfirmationDialog.java (1 edges - Type: INCLUDE)
- model/src/main/java/de/danoeh/antennapod/model/feed/FeedItem.java (1 edges - Type: INCLUDE)
- event/src/main/java/de/danoeh/antennapod/event/EpisodeDownloadEvent.java (1 edges - Type: INCLUDE)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/Converter.java (1 edges - Type: INCLUDE)
- event/src/main/java/de/danoeh/antennapod/event/playback/PlaybackPositionEvent.java (1 edges - Type: INCLUDE)
- event/src/main/java/de/danoeh/antennapod/event/FeedItemEvent.java (1 edges - Type: INCLUDE)

### 6. storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBWriter.java
- **Role**: INFRASTRUCTURE
[View Source File](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBWriter.java)

**Evidence (Observed Behavior)**
- Boundary Crossing: 18
- Blast Radius (Clusters): 4
- Fan-Out: 18
- Fan-In: 31

**Architectural Assessment**
> NORMAL: Standard node behavior without severe structural anomalies.

**Risk Level**: NONE

**Recommended Action**
> No immediate architectural action required.

**Top External Targets (Evidence)**
- storage/preferences/src/main/java/de/danoeh/antennapod/storage/preferences/PlaybackPreferences.java (1 edges - Type: INCLUDE)
- model/src/main/java/de/danoeh/antennapod/model/feed/FeedPreferences.java (1 edges - Type: INCLUDE)
- model/src/main/java/de/danoeh/antennapod/model/download/DownloadResult.java (1 edges - Type: INCLUDE)
- event/src/main/java/de/danoeh/antennapod/event/playback/PlaybackHistoryEvent.java (1 edges - Type: INCLUDE)
- event/src/main/java/de/danoeh/antennapod/event/DownloadLogEvent.java (1 edges - Type: INCLUDE)
- event/src/main/java/de/danoeh/antennapod/event/FeedEvent.java (1 edges - Type: INCLUDE)
- event/src/main/java/de/danoeh/antennapod/event/QueueEvent.java (1 edges - Type: INCLUDE)
- model/src/main/java/de/danoeh/antennapod/model/feed/SortOrder.java (1 edges - Type: INCLUDE)
- model/src/main/java/de/danoeh/antennapod/model/feed/FeedMedia.java (1 edges - Type: INCLUDE)
- ui/app-start-intent/src/main/java/de/danoeh/antennapod/ui/appstartintent/MediaButtonStarter.java (1 edges - Type: INCLUDE)

### 7. app/src/main/java/de/danoeh/antennapod/ui/screen/download/CompletedDownloadsFragment.java
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/download/CompletedDownloadsFragment.java)

**Evidence (Observed Behavior)**
- Boundary Crossing: 16
- Blast Radius (Clusters): 20
- Fan-Out: 30
- Fan-In: 5

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- event/src/main/java/de/danoeh/antennapod/event/FeedUpdateRunningEvent.java (1 edges - Type: INCLUDE)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBReader.java (1 edges - Type: INCLUDE)
- event/src/main/java/de/danoeh/antennapod/event/FeedItemEvent.java (1 edges - Type: INCLUDE)
- model/src/main/java/de/danoeh/antennapod/model/feed/SortOrder.java (1 edges - Type: INCLUDE)
- Fragment (1 edges - Type: EXTENDS)
- MaterialToolbar.OnMenuItemClickListener (1 edges - Type: IMPLEMENTS)
- Observable (1 edges - Type: INCLUDE)
- event/src/main/java/de/danoeh/antennapod/event/DownloadLogEvent.java (1 edges - Type: INCLUDE)
- model/src/main/java/de/danoeh/antennapod/model/feed/FeedItemFilter.java (1 edges - Type: INCLUDE)
- event/src/main/java/de/danoeh/antennapod/event/PlayerStatusEvent.java (1 edges - Type: INCLUDE)

### 8. app/src/main/java/de/danoeh/antennapod/ui/screen/SearchFragment.java
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/SearchFragment.java)

**Evidence (Observed Behavior)**
- Boundary Crossing: 16
- Blast Radius (Clusters): 20
- Fan-Out: 28
- Fan-In: 7

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- event/src/main/java/de/danoeh/antennapod/event/MessageEvent.java (1 edges - Type: INCLUDE)
- model/src/main/java/de/danoeh/antennapod/model/feed/FeedItem.java (1 edges - Type: INCLUDE)
- Fragment (1 edges - Type: EXTENDS)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/Keyboard.java (1 edges - Type: INCLUDE)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBReader.java (1 edges - Type: INCLUDE)
- event/src/main/java/de/danoeh/antennapod/event/playback/PlaybackPositionEvent.java (1 edges - Type: INCLUDE)
- ui/app-start-intent/src/main/java/de/danoeh/antennapod/ui/appstartintent/OnlineFeedviewActivityStarter.java (1 edges - Type: INCLUDE)
- Observable (1 edges - Type: INCLUDE)
- event/src/main/java/de/danoeh/antennapod/event/EpisodeDownloadEvent.java (1 edges - Type: INCLUDE)
- ui/discovery/src/main/java/de/danoeh/antennapod/ui/discovery/OnlineSearchFragment.java (1 edges - Type: INCLUDE)

### 9. app/src/main/java/de/danoeh/antennapod/ui/screen/drawer/NavDrawerFragment.java
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/drawer/NavDrawerFragment.java)

**Evidence (Observed Behavior)**
- Boundary Crossing: 16
- Blast Radius (Clusters): 20
- Fan-Out: 24
- Fan-In: 1

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/ConfirmationDialog.java (1 edges - Type: INCLUDE)
- SharedPreferences.OnSharedPreferenceChangeListener (1 edges - Type: IMPLEMENTS)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/NavDrawerData.java (1 edges - Type: INCLUDE)
- model/src/main/java/de/danoeh/antennapod/model/feed/FeedPreferences.java (1 edges - Type: INCLUDE)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBReader.java (1 edges - Type: INCLUDE)
- StringUtils (1 edges - Type: INCLUDE)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBWriter.java (1 edges - Type: INCLUDE)
- storage/preferences/src/main/java/de/danoeh/antennapod/storage/preferences/UserPreferences.java (1 edges - Type: INCLUDE)
- Fragment (1 edges - Type: EXTENDS)
- ui/app-start-intent/src/main/java/de/danoeh/antennapod/ui/appstartintent/MainActivityStarter.java (1 edges - Type: INCLUDE)

### 10. playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackController.java
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackController.java)

**Evidence (Observed Behavior)**
- Boundary Crossing: 16
- Blast Radius (Clusters): 7
- Fan-Out: 16
- Fan-In: 9

**Architectural Assessment**
> NORMAL: Standard node behavior without severe structural anomalies.

**Risk Level**: NONE

**Recommended Action**
> No immediate architectural action required.

**Top External Targets (Evidence)**
- model/src/main/java/de/danoeh/antennapod/model/playback/MediaType.java (1 edges - Type: INCLUDE)
- model/src/main/java/de/danoeh/antennapod/model/playback/Playable.java (1 edges - Type: INCLUDE)
- model/src/main/java/de/danoeh/antennapod/model/feed/FeedPreferences.java (1 edges - Type: INCLUDE)
- event/src/main/java/de/danoeh/antennapod/event/playback/PlaybackPositionEvent.java (1 edges - Type: INCLUDE)
- ListenableFuture (1 edges - Type: INCLUDE)
- event/src/main/java/de/danoeh/antennapod/event/playback/PlaybackServiceEvent.java (1 edges - Type: INCLUDE)
- storage/preferences/src/main/java/de/danoeh/antennapod/storage/preferences/PlaybackPreferences.java (1 edges - Type: INCLUDE)
- MoreExecutors (1 edges - Type: INCLUDE)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBWriter.java (1 edges - Type: INCLUDE)
- model/src/main/java/de/danoeh/antennapod/model/playback/TimerValue.java (1 edges - Type: INCLUDE)


## 3. Evidence Layer
### 3.1 Ghost Evidence
<details><summary><b>Show Ghost Evidence (Top 50)</b></summary>

- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/GenerativePlaceholderImageModelLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/GenerativePlaceholderImageModelLoader.java) -> ModelLoaderFactory (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/MetadataRetrieverLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/MetadataRetrieverLoader.java) -> ModelLoaderFactory (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ChapterImageModelLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ChapterImageModelLoader.java) -> ModelLoader (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/NoHttpStringLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/NoHttpStringLoader.java) -> ModelLoaderFactory (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ResizingOkHttpStreamFetcher.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ResizingOkHttpStreamFetcher.java) -> OkHttpStreamFetcher (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/GenerativePlaceholderImageModelLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/GenerativePlaceholderImageModelLoader.java) -> ModelLoader (Count: 1)
- [ui/statistics/src/main/java/de/danoeh/antennapod/ui/statistics/StatisticsListAdapter.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/statistics/src/main/java/de/danoeh/antennapod/ui/statistics/StatisticsListAdapter.java) -> RecyclerView.Adapter (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/AudioCoverFetcher.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/AudioCoverFetcher.java) -> DataFetcher (Count: 1)
- [ui/statistics/src/main/java/de/danoeh/antennapod/ui/statistics/PieChartView.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/statistics/src/main/java/de/danoeh/antennapod/ui/statistics/PieChartView.java) -> Drawable (Count: 1)
- [ui/transcript/src/main/java/de/danoeh/antennapod/ui/transcript/TranscriptUtils.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/transcript/src/main/java/de/danoeh/antennapod/ui/transcript/TranscriptUtils.java) -> Response (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ApOkHttpUrlLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ApOkHttpUrlLoader.java) -> OkHttpClient (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ApOkHttpUrlLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ApOkHttpUrlLoader.java) -> Interceptor (Count: 1)
- [ui/statistics/src/main/java/de/danoeh/antennapod/ui/statistics/StatisticsListAdapter.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/statistics/src/main/java/de/danoeh/antennapod/ui/statistics/StatisticsListAdapter.java) -> RecyclerView.ViewHolder (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ApGlideModule.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ApGlideModule.java) -> AppGlideModule (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ChapterImageModelLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ChapterImageModelLoader.java) -> ModelLoaderFactory (Count: 1)
- [ui/statistics/src/main/java/de/danoeh/antennapod/ui/statistics/StatisticsFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/statistics/src/main/java/de/danoeh/antennapod/ui/statistics/StatisticsFragment.java) -> FragmentStateAdapter (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ResizingOkHttpStreamFetcher.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ResizingOkHttpStreamFetcher.java) -> FileUtils (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ApOkHttpUrlLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ApOkHttpUrlLoader.java) -> Protocol (Count: 1)
- [ui/transcript/src/main/java/de/danoeh/antennapod/ui/transcript/TranscriptUtils.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/transcript/src/main/java/de/danoeh/antennapod/ui/transcript/TranscriptUtils.java) -> CacheControl (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ChapterImageModelLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ChapterImageModelLoader.java) -> Response (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ApOkHttpUrlLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ApOkHttpUrlLoader.java) -> ModelLoader (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ResizingOkHttpStreamFetcher.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ResizingOkHttpStreamFetcher.java) -> IOUtils (Count: 1)
- [ui/statistics/src/main/java/de/danoeh/antennapod/ui/statistics/PieChartView.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/statistics/src/main/java/de/danoeh/antennapod/ui/statistics/PieChartView.java) -> AppCompatImageView (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ChapterImageModelLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ChapterImageModelLoader.java) -> DataFetcher (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ChapterImageModelLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ChapterImageModelLoader.java) -> IOUtils (Count: 1)
- [ui/statistics/src/main/java/de/danoeh/antennapod/ui/statistics/StatisticsFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/statistics/src/main/java/de/danoeh/antennapod/ui/statistics/StatisticsFragment.java) -> Completable (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/NoHttpStringLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/NoHttpStringLoader.java) -> StringLoader (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ApOkHttpUrlLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ApOkHttpUrlLoader.java) -> Response (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/FastBlurTransformation.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/FastBlurTransformation.java) -> BitmapTransformation (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ApOkHttpUrlLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ApOkHttpUrlLoader.java) -> ResponseBody (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ResizingOkHttpStreamFetcher.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ResizingOkHttpStreamFetcher.java) -> Call (Count: 1)
- [ui/transcript/src/main/java/de/danoeh/antennapod/ui/transcript/TranscriptUtils.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/transcript/src/main/java/de/danoeh/antennapod/ui/transcript/TranscriptUtils.java) -> FileUtils (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ApOkHttpUrlLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ApOkHttpUrlLoader.java) -> InputStream> (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/MetadataRetrieverLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/MetadataRetrieverLoader.java) -> ModelLoader (Count: 1)
- [ui/transcript/src/main/java/de/danoeh/antennapod/ui/transcript/TranscriptUtils.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/transcript/src/main/java/de/danoeh/antennapod/ui/transcript/TranscriptUtils.java) -> IOUtils (Count: 1)
- [ui/widget/src/main/java/de/danoeh/antennapod/ui/widget/PlayerWidget.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/widget/src/main/java/de/danoeh/antennapod/ui/widget/PlayerWidget.java) -> AppWidgetProvider (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ChapterImageModelLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ChapterImageModelLoader.java) -> ByteBuffer> (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ApOkHttpUrlLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/ApOkHttpUrlLoader.java) -> ModelLoaderFactory (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/MetadataRetrieverLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/MetadataRetrieverLoader.java) -> InputStream> (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/GenerativePlaceholderImageModelLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/GenerativePlaceholderImageModelLoader.java) -> DataFetcher (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/NoHttpStringLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/NoHttpStringLoader.java) -> InputStream> (Count: 1)
- [ui/transcript/src/main/java/de/danoeh/antennapod/ui/transcript/TranscriptUtils.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/transcript/src/main/java/de/danoeh/antennapod/ui/transcript/TranscriptUtils.java) -> StringUtils (Count: 1)
- [ui/widget/src/main/java/de/danoeh/antennapod/ui/widget/WidgetUpdaterWorker.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/widget/src/main/java/de/danoeh/antennapod/ui/widget/WidgetUpdaterWorker.java) -> Worker (Count: 1)
- [ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/GenerativePlaceholderImageModelLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/GenerativePlaceholderImageModelLoader.java) -> InputStream> (Count: 1)
</details>

### 3.2 Boundary Evidence
<details><summary><b>Show Boundary Evidence (Top 50)</b></summary>

- [parser/feed/src/main/java/de/danoeh/antennapod/parser/feed/UnsupportedFeedtypeException.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/parser/feed/src/main/java/de/danoeh/antennapod/parser/feed/UnsupportedFeedtypeException.java) -> Exception (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/drawer/NavigationNames.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/drawer/NavigationNames.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/AddFeedFragment.java (Count: 1)
- [playback/service/src/main/java/de/danoeh/antennapod/playback/service/Media3PlaybackService.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/playback/service/src/main/java/de/danoeh/antennapod/playback/service/Media3PlaybackService.java) -> playback/base/src/main/java/de/danoeh/antennapod/playback/base/PlayerStatus.java (Count: 1)
- [playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackService.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackService.java) -> model/src/main/java/de/danoeh/antennapod/model/playback/Playable.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/download/DownloadLogFragment.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/chapter/ChaptersFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/chapter/ChaptersFragment.java) -> AppCompatDialogFragment (Count: 1)
- [playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackService.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackService.java) -> playback/base/src/main/java/de/danoeh/antennapod/playback/base/PlayerStatus.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/preferences/ProxyDialog.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/preferences/ProxyDialog.java) -> Credentials (Count: 1)
- [app-wearos/src/main/java/de/danoeh/antennapod/wearos/FeedListViewModel.kt](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app-wearos/src/main/java/de/danoeh/antennapod/wearos/FeedListViewModel.kt) -> model/src/main/java/de/danoeh/antennapod/model/feed/Feed.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/playback/PlaybackSpeedSeekBar.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/playback/PlaybackSpeedSeekBar.java) -> FrameLayout (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/preferences/ImportExportPreferencesFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/preferences/ImportExportPreferencesFragment.java) -> storage/importexport/src/main/java/de/danoeh/antennapod/storage/importexport/DatabaseExporter.java (Count: 1)
- [playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackService.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackService.java) -> playback/cast/src/play/java/de/danoeh/antennapod/playback/cast/CastStateListener.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java) -> event/src/main/java/de/danoeh/antennapod/event/StreamingConfirmationEvent.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/preferences/SwipePreferencesFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/preferences/SwipePreferencesFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/AllEpisodesFragment.java (Count: 1)
- [ui/widget/src/main/java/de/danoeh/antennapod/ui/widget/WidgetUpdater.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/widget/src/main/java/de/danoeh/antennapod/ui/widget/WidgetUpdater.java) -> model/src/main/java/de/danoeh/antennapod/model/playback/Playable.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/cleaner/HtmlToPlainText.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/cleaner/HtmlToPlainText.java) -> Document (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/subscriptions/TagMenuHandler.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/subscriptions/TagMenuHandler.java) -> storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBWriter.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/home/HomeSection.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/home/HomeSection.java) -> Fragment (Count: 1)
- [playback/service/src/main/java/de/danoeh/antennapod/playback/service/Media3PlaybackService.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/playback/service/src/main/java/de/danoeh/antennapod/playback/service/Media3PlaybackService.java) -> storage/preferences/src/main/java/de/danoeh/antennapod/storage/preferences/SleepTimerType.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/playback/TranscriptDialogFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/playback/TranscriptDialogFragment.java) -> model/src/main/java/de/danoeh/antennapod/model/feed/Transcript.java (Count: 1)
- [ui/chapters/src/main/java/de/danoeh/antennapod/ui/chapters/ChapterUtils.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/chapters/src/main/java/de/danoeh/antennapod/ui/chapters/ChapterUtils.java) -> CacheControl (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/episodeslist/FeedItemMenuHandler.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/episodeslist/FeedItemMenuHandler.java) -> app/src/main/java/de/danoeh/antennapod/ui/share/ShareUtils.java (Count: 1)
- [app-wearos/src/main/java/de/danoeh/antennapod/wearos/sync/WearDataRepository.kt](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app-wearos/src/main/java/de/danoeh/antennapod/wearos/sync/WearDataRepository.kt) -> StateFlow (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/cleaner/ShownotesCleaner.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/cleaner/ShownotesCleaner.java) -> Jsoup (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/swipeactions/SwipeActionsDialog.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/swipeactions/SwipeActionsDialog.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/FavoritesFragment.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/episodeslist/EpisodeItemViewHolder.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/episodeslist/EpisodeItemViewHolder.java) -> model/src/main/java/de/danoeh/antennapod/model/feed/FeedItem.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/feed/FeedItemlistFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/feed/FeedItemlistFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/download/DownloadLogDetailsDialog.java (Count: 1)
- [playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackServiceStarter.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackServiceStarter.java) -> playback/base/src/main/java/de/danoeh/antennapod/playback/base/MediaItemAdapter.java (Count: 1)
- [scripts/getChangelog.py](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/scripts/getChangelog.py) -> requests (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/feed/RenameFeedDialog.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/feed/RenameFeedDialog.java) -> model/src/main/java/de/danoeh/antennapod/model/feed/FeedPreferences.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/activity/OpmlImportActivity.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/activity/OpmlImportActivity.java) -> storage/database/src/main/java/de/danoeh/antennapod/storage/database/FeedDatabaseWriter.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/episodeslist/EpisodesListFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/episodeslist/EpisodesListFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/swipeactions/SwipeActions.java (Count: 1)
- [storage/importexport/src/main/java/de/danoeh/antennapod/storage/importexport/OpmlBackupAgent.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/storage/importexport/src/main/java/de/danoeh/antennapod/storage/importexport/OpmlBackupAgent.java) -> model/src/main/java/de/danoeh/antennapod/model/feed/Feed.java (Count: 1)
- [net/discovery/src/main/java/de/danoeh/antennapod/net/discovery/PodcastIndexPodcastSearcher.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/net/discovery/src/main/java/de/danoeh/antennapod/net/discovery/PodcastIndexPodcastSearcher.java) -> SingleOnSubscribe (Count: 1)
- [playback/service/src/main/java/de/danoeh/antennapod/playback/service/Media3PlaybackService.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/playback/service/src/main/java/de/danoeh/antennapod/playback/service/Media3PlaybackService.java) -> model/src/main/java/de/danoeh/antennapod/model/feed/FeedMedia.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/preferences/SwipePreferencesFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/preferences/SwipePreferencesFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/queue/QueueFragment.java (Count: 1)
- [net/discovery/src/main/java/de/danoeh/antennapod/net/discovery/ItunesTopListLoader.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/net/discovery/src/main/java/de/danoeh/antennapod/net/discovery/ItunesTopListLoader.java) -> JSONArray (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/view/FloatingSelectMenu.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/view/FloatingSelectMenu.java) -> FrameLayout (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/SimpleChipAdapter.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/SimpleChipAdapter.java) -> RecyclerView.ViewHolder (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/subscriptions/SubscriptionFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/subscriptions/SubscriptionFragment.java) -> model/src/main/java/de/danoeh/antennapod/model/feed/FeedPreferences.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/drawer/NavDrawerFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/drawer/NavDrawerFragment.java) -> ui/common/src/main/java/de/danoeh/antennapod/ui/common/ConfirmationDialog.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/download/DownloadLogAdapter.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/download/DownloadLogAdapter.java) -> app/src/main/java/de/danoeh/antennapod/actionbutton/DownloadActionButton.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/queue/QueueFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/queue/QueueFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/InboxFragment.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/AllEpisodesFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/AllEpisodesFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/AllEpisodesFilterDialog.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/episodeslist/EpisodeItemViewHolder.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/episodeslist/EpisodeItemViewHolder.java) -> ui/common/src/main/java/de/danoeh/antennapod/ui/common/CircularProgressBar.java (Count: 1)
- [ui/discovery/src/main/java/de/danoeh/antennapod/ui/discovery/DiscoveryFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/discovery/src/main/java/de/danoeh/antennapod/ui/discovery/DiscoveryFragment.java) -> net/discovery/src/main/java/de/danoeh/antennapod/net/discovery/ItunesTopListLoader.java (Count: 1)
- [ui/discovery/src/main/java/de/danoeh/antennapod/ui/discovery/FeedDiscoverAdapter.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/discovery/src/main/java/de/danoeh/antennapod/ui/discovery/FeedDiscoverAdapter.java) -> net/discovery/src/main/java/de/danoeh/antennapod/net/discovery/PodcastSearchResult.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/feed/FeedItemlistFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/feed/FeedItemlistFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/FeedItemFilterDialog.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/download/CompletedDownloadsFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/download/CompletedDownloadsFragment.java) -> app/src/main/java/de/danoeh/antennapod/actionbutton/DeleteActionButton.java (Count: 1)
- [ui/widget/src/main/java/de/danoeh/antennapod/ui/widget/WidgetUpdaterWorker.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/ui/widget/src/main/java/de/danoeh/antennapod/ui/widget/WidgetUpdaterWorker.java) -> ui/episodes/src/main/java/de/danoeh/antennapod/ui/episodes/PlaybackSpeedUtils.java (Count: 1)
</details>

## 4. System Assembly Points (Healthy Hubs)
- [playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackService.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackService.java) (Role: ASSEMBLY_POINT)
- [playback/service/src/main/java/de/danoeh/antennapod/playback/service/Media3PlaybackService.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/playback/service/src/main/java/de/danoeh/antennapod/playback/service/Media3PlaybackService.java) (Role: ASSEMBLY_POINT)

### 4.1 ASSEMBLY_POINT Audit
app/src/main/java/de/danoeh/antennapod/PodcastApp.java
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
app/src/main/java/de/danoeh/antennapod/ui/view/SimpleAdapterDataObserver.java
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
app/src/play/java/de/danoeh/antennapod/WearListenerService.java
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
net/common/src/main/java/de/danoeh/antennapod/net/common/AntennapodHttpClient.java
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
playback/service/src/main/java/de/danoeh/antennapod/playback/service/Media3PlaybackService.java
Verdict: ACCEPTED

Evidence
FanOut: 35
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackService.java
Verdict: ACCEPTED

Evidence
FanOut: 41
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
playback/service/src/main/java/de/danoeh/antennapod/playback/service/QuickSettingsTileService.java
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---

## 5. Knowledge Connectivity
*No knowledge sources linked.*

## 7. Architectural Reasoning
### Q4 Extension Points
- **FrameLayout** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **ModelLoaderFactory** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
- **SharedPreferences.OnSharedPreferenceChangeListener** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **ArrayAdapter** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **app/src/main/java/de/danoeh/antennapod/actionbutton/ItemActionButton.java** (Confidence: 1.00)
  - - 9 implementations
  - - [EXTENSION_DENSITY] Has 9 implementations.
- **BottomSheetDialogFragment** (Confidence: 1.00)
  - - 8 implementations
  - - [EXTENSION_DENSITY] Has 8 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **app/src/main/java/de/danoeh/antennapod/ui/screen/feed/RemoveFeedDialog.java** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **app/src/main/java/de/danoeh/antennapod/ui/swipeactions/SwipeAction.java** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 10 implementations.
- **MaterialToolbar.OnMenuItemClickListener** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **app/src/main/java/de/danoeh/antennapod/ui/screen/feed/ItemSortDialog.java** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **AdapterView.OnItemClickListener** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **FragmentStateAdapter** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **BaseAdapter** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **DialogFragment** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **Interceptor** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **app/src/main/java/de/danoeh/antennapod/ui/episodeslist/EpisodeItemListAdapter.java** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **app/src/main/java/de/danoeh/antennapod/ui/SelectableAdapter.java** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **Toolbar.OnMenuItemClickListener** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **ui/common/src/main/java/de/danoeh/antennapod/ui/common/ToolbarActivity.java** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **AppCompatImageView** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **WearableListenerService** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **OnBackPressedCallback** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **RecyclerView.ItemDecoration** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **ActivityResultContracts.OpenDocumentTree** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **model/src/main/java/de/danoeh/antennapod/model/playback/Playable.java** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **ModelLoader** (Confidence: 0.90)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
- **net/discovery/src/main/java/de/danoeh/antennapod/net/discovery/PodcastSearcher.java** (Confidence: 0.90)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
- **AndroidViewModel** (Confidence: 0.90)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
- **app/src/main/java/de/danoeh/antennapod/ui/episodeslist/EpisodesListFragment.java** (Confidence: 0.90)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
- **ComponentActivity** (Confidence: 0.90)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
- **InputStream>** (Confidence: 0.90)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
- **DataFetcher** (Confidence: 0.80)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
- **playback/base/src/main/java/de/danoeh/antennapod/playback/base/PlaybackServiceMediaPlayer.java** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **app/src/main/java/de/danoeh/antennapod/ui/screen/feed/ItemFilterDialog.java** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **NodeVisitor** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.

## 6. Raw Metrics
### 6.1 Global Metrics
- **Boundary Ratio**: 83.5%

### 6.2 Source Breakdown (ASR 3.0)
#### Ghost Source Top N
  - N/A

#### Coupling Source Top N
  - **app**: 886 (29.9%)
  - **model**: 444 (15%)
  - **storage**: 328 (11.1%)
  - **ui**: 262 (8.8%)
  - **playback**: 168 (5.7%)
  - ...