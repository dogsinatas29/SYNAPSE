# 🔬 SYNAPSE Architecture Scan Report (EV-LIVE)
Generated: 2026-08-19T03:13:46.502Z

## 0. Analysis Subject (Layer -3)
- **Subject**: Module: app/src/main/java/de/danoeh/antennapod
- **Files**: 175
- **Internal Edges**: 278
- **Boundary Edges**: 905

### Subject Fingerprint (Top Internal Domains)
- Module: app/src/main/java/de/danoeh/antennapod
- Module: app/src/androidTest/java/de/test/antennapod
- Module: app/src

## 1. Executive Summary
**Scan Context**: Sub-cluster Analysis
**Observation**: External Dependency Ratio = 3.3x
**Assessment**: Selected cluster depends heavily on modules outside the scan boundary.
**Implication**: This does not imply whole-project instability.

**Why High External Coupling?**
- **Boundary Edge Count**: 905 / 278 (Internal)
- **Top 3 Contributors**: 상위 3개 파일(FeedItemlistFragment.java, ItemFragment.java, MainActivity.java)이 전체 Boundary Edge의 **8.6%** (78개)를 생성하고 있습니다.



**Cumulative Boundary Contribution**
- **Top 3**: 8.6% (78 edges)
- **Top 10**: 22.0% (199 edges)
- **Top 50**: 61.2% (554 edges)
- **Top 100**: 76.5% (692 edges)

**Audit Confidence**: 76%

Base Score                     70
Grammar Noise Filtered        +0
Assembly Point Classified      +0
Contract Hub Verified          +0
Ghost Ratio < 5%               +6
Unknown References             0
Final Score                   76

### Global Metrics
- **Entropy**: 12
- **Ghost Dependencies**: 246

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
- Blast Radius (Clusters): 18
- Fan-Out: 46
- Fan-In: 8

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- Fragment (1 edges - Type: UNKNOWN)
- model/src/main/java/de/danoeh/antennapod/model/download/DownloadResult.java (1 edges - Type: UNKNOWN)
- MaterialToolbar.OnMenuItemClickListener (1 edges - Type: UNKNOWN)
- ui/app-start-intent/src/main/java/de/danoeh/antennapod/ui/appstartintent/MainActivityStarter.java (1 edges - Type: UNKNOWN)
- ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/FastBlurTransformation.java (1 edges - Type: UNKNOWN)
- Completable (1 edges - Type: UNKNOWN)
- model/src/main/java/de/danoeh/antennapod/model/feed/FeedItemFilter.java (1 edges - Type: UNKNOWN)
- event/src/main/java/de/danoeh/antennapod/event/FeedUpdateRunningEvent.java (1 edges - Type: UNKNOWN)
- event/src/main/java/de/danoeh/antennapod/event/QueueEvent.java (1 edges - Type: UNKNOWN)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBWriter.java (1 edges - Type: UNKNOWN)

### 2. app/src/main/java/de/danoeh/antennapod/ui/screen/episode/ItemFragment.java
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/episode/ItemFragment.java)

**Evidence (Observed Behavior)**
- Boundary Crossing: 26
- Blast Radius (Clusters): 18
- Fan-Out: 39
- Fan-In: 0

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/DateFormatter.java (1 edges - Type: UNKNOWN)
- Fragment (1 edges - Type: UNKNOWN)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBReader.java (1 edges - Type: UNKNOWN)
- event/src/main/java/de/danoeh/antennapod/event/PlayerStatusEvent.java (1 edges - Type: UNKNOWN)
- Observable (1 edges - Type: UNKNOWN)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/ThemeUtils.java (1 edges - Type: UNKNOWN)
- model/src/main/java/de/danoeh/antennapod/model/feed/FeedItem.java (1 edges - Type: UNKNOWN)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/ClipboardUtils.java (1 edges - Type: UNKNOWN)
- playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackController.java (1 edges - Type: UNKNOWN)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/ImagePlaceholder.java (1 edges - Type: UNKNOWN)

### 3. app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java)

**Evidence (Observed Behavior)**
- Boundary Crossing: 24
- Blast Radius (Clusters): 18
- Fan-Out: 45
- Fan-In: 16

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- event/src/main/java/de/danoeh/antennapod/event/StreamingConfirmationEvent.java (1 edges - Type: UNKNOWN)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/ThemeUtils.java (1 edges - Type: UNKNOWN)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/NavigationToolbarActivity.java (1 edges - Type: UNKNOWN)
- event/src/main/java/de/danoeh/antennapod/event/MessageEvent.java (1 edges - Type: UNKNOWN)
- storage/preferences/src/main/java/de/danoeh/antennapod/storage/preferences/UserPreferences.java (1 edges - Type: UNKNOWN)
- ui/app-start-intent/src/main/java/de/danoeh/antennapod/ui/appstartintent/MediaButtonStarter.java (1 edges - Type: UNKNOWN)
- playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackServiceInterface.java (1 edges - Type: UNKNOWN)
- storage/database-maintenance-service/src/main/java/de/danoeh/antennapod/storage/databasemaintenanceservice/DatabaseMaintenanceWorker.java (1 edges - Type: UNKNOWN)
- ui/statistics/src/main/java/de/danoeh/antennapod/ui/statistics/StatisticsFragment.java (1 edges - Type: UNKNOWN)
- ui/app-start-intent/src/main/java/de/danoeh/antennapod/ui/appstartintent/MainActivityStarter.java (1 edges - Type: UNKNOWN)

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
- net/discovery/src/main/java/de/danoeh/antennapod/net/discovery/PodcastSearcherRegistry.java (1 edges - Type: UNKNOWN)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBWriter.java (1 edges - Type: UNKNOWN)
- event/src/main/java/de/danoeh/antennapod/event/MessageEvent.java (1 edges - Type: UNKNOWN)
- parser/feed/src/main/java/de/danoeh/antennapod/parser/feed/FeedHandlerResult.java (1 edges - Type: UNKNOWN)
- Maybe (1 edges - Type: UNKNOWN)
- ui/app-start-intent/src/main/java/de/danoeh/antennapod/ui/appstartintent/MainActivityStarter.java (1 edges - Type: UNKNOWN)
- model/src/main/java/de/danoeh/antennapod/model/feed/Feed.java (1 edges - Type: UNKNOWN)
- net/discovery/src/main/java/de/danoeh/antennapod/net/discovery/FeedUrlNotFoundException.java (1 edges - Type: UNKNOWN)
- Observable (1 edges - Type: UNKNOWN)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/ThemeUtils.java (1 edges - Type: UNKNOWN)

### 5. app/src/main/java/de/danoeh/antennapod/ui/screen/queue/QueueFragment.java
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/queue/QueueFragment.java)

**Evidence (Observed Behavior)**
- Boundary Crossing: 20
- Blast Radius (Clusters): 18
- Fan-Out: 34
- Fan-In: 7

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- event/src/main/java/de/danoeh/antennapod/event/QueueEvent.java (1 edges - Type: UNKNOWN)
- Observable (1 edges - Type: UNKNOWN)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBWriter.java (1 edges - Type: UNKNOWN)
- Fragment (1 edges - Type: UNKNOWN)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/ConfirmationDialog.java (1 edges - Type: UNKNOWN)
- model/src/main/java/de/danoeh/antennapod/model/feed/FeedItem.java (1 edges - Type: UNKNOWN)
- event/src/main/java/de/danoeh/antennapod/event/EpisodeDownloadEvent.java (1 edges - Type: UNKNOWN)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/Converter.java (1 edges - Type: UNKNOWN)
- event/src/main/java/de/danoeh/antennapod/event/playback/PlaybackPositionEvent.java (1 edges - Type: UNKNOWN)
- event/src/main/java/de/danoeh/antennapod/event/FeedItemEvent.java (1 edges - Type: UNKNOWN)

### 6. app/src/main/java/de/danoeh/antennapod/ui/screen/download/CompletedDownloadsFragment.java
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/download/CompletedDownloadsFragment.java)

**Evidence (Observed Behavior)**
- Boundary Crossing: 16
- Blast Radius (Clusters): 18
- Fan-Out: 30
- Fan-In: 5

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- event/src/main/java/de/danoeh/antennapod/event/FeedUpdateRunningEvent.java (1 edges - Type: UNKNOWN)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBReader.java (1 edges - Type: UNKNOWN)
- event/src/main/java/de/danoeh/antennapod/event/FeedItemEvent.java (1 edges - Type: UNKNOWN)
- model/src/main/java/de/danoeh/antennapod/model/feed/SortOrder.java (1 edges - Type: UNKNOWN)
- Fragment (1 edges - Type: UNKNOWN)
- MaterialToolbar.OnMenuItemClickListener (1 edges - Type: UNKNOWN)
- Observable (1 edges - Type: UNKNOWN)
- event/src/main/java/de/danoeh/antennapod/event/DownloadLogEvent.java (1 edges - Type: UNKNOWN)
- model/src/main/java/de/danoeh/antennapod/model/feed/FeedItemFilter.java (1 edges - Type: UNKNOWN)
- event/src/main/java/de/danoeh/antennapod/event/PlayerStatusEvent.java (1 edges - Type: UNKNOWN)

### 7. app/src/main/java/de/danoeh/antennapod/ui/screen/SearchFragment.java
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/SearchFragment.java)

**Evidence (Observed Behavior)**
- Boundary Crossing: 16
- Blast Radius (Clusters): 18
- Fan-Out: 28
- Fan-In: 7

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- event/src/main/java/de/danoeh/antennapod/event/MessageEvent.java (1 edges - Type: UNKNOWN)
- model/src/main/java/de/danoeh/antennapod/model/feed/FeedItem.java (1 edges - Type: UNKNOWN)
- Fragment (1 edges - Type: UNKNOWN)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/Keyboard.java (1 edges - Type: UNKNOWN)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBReader.java (1 edges - Type: UNKNOWN)
- event/src/main/java/de/danoeh/antennapod/event/playback/PlaybackPositionEvent.java (1 edges - Type: UNKNOWN)
- ui/app-start-intent/src/main/java/de/danoeh/antennapod/ui/appstartintent/OnlineFeedviewActivityStarter.java (1 edges - Type: UNKNOWN)
- Observable (1 edges - Type: UNKNOWN)
- event/src/main/java/de/danoeh/antennapod/event/EpisodeDownloadEvent.java (1 edges - Type: UNKNOWN)
- ui/discovery/src/main/java/de/danoeh/antennapod/ui/discovery/OnlineSearchFragment.java (1 edges - Type: UNKNOWN)

### 8. app/src/main/java/de/danoeh/antennapod/ui/screen/drawer/NavDrawerFragment.java
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/drawer/NavDrawerFragment.java)

**Evidence (Observed Behavior)**
- Boundary Crossing: 16
- Blast Radius (Clusters): 18
- Fan-Out: 24
- Fan-In: 1

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/ConfirmationDialog.java (1 edges - Type: UNKNOWN)
- SharedPreferences.OnSharedPreferenceChangeListener (1 edges - Type: UNKNOWN)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/NavDrawerData.java (1 edges - Type: UNKNOWN)
- model/src/main/java/de/danoeh/antennapod/model/feed/FeedPreferences.java (1 edges - Type: UNKNOWN)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBReader.java (1 edges - Type: UNKNOWN)
- StringUtils (1 edges - Type: UNKNOWN)
- storage/database/src/main/java/de/danoeh/antennapod/storage/database/DBWriter.java (1 edges - Type: UNKNOWN)
- storage/preferences/src/main/java/de/danoeh/antennapod/storage/preferences/UserPreferences.java (1 edges - Type: UNKNOWN)
- Fragment (1 edges - Type: UNKNOWN)
- ui/app-start-intent/src/main/java/de/danoeh/antennapod/ui/appstartintent/MainActivityStarter.java (1 edges - Type: UNKNOWN)

### 9. app/src/main/java/de/danoeh/antennapod/ui/screen/feed/FeedInfoFragment.java
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/feed/FeedInfoFragment.java)

**Evidence (Observed Behavior)**
- Boundary Crossing: 15
- Blast Radius (Clusters): 18
- Fan-Out: 19
- Fan-In: 0

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- model/src/main/java/de/danoeh/antennapod/model/feed/Feed.java (1 edges - Type: UNKNOWN)
- ui/statistics/src/main/java/de/danoeh/antennapod/ui/statistics/StatisticsFragment.java (1 edges - Type: UNKNOWN)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/ClipboardUtils.java (1 edges - Type: UNKNOWN)
- StringUtils (1 edges - Type: UNKNOWN)
- MaterialToolbar.OnMenuItemClickListener (1 edges - Type: UNKNOWN)
- Fragment (1 edges - Type: UNKNOWN)
- Maybe (1 edges - Type: UNKNOWN)
- ui/app-start-intent/src/main/java/de/danoeh/antennapod/ui/appstartintent/MainActivityStarter.java (1 edges - Type: UNKNOWN)
- ui/glide/src/main/java/de/danoeh/antennapod/ui/glide/FastBlurTransformation.java (1 edges - Type: UNKNOWN)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/IntentUtils.java (1 edges - Type: UNKNOWN)

### 10. app/src/main/java/de/danoeh/antennapod/ui/screen/playback/SleepTimerDialog.java
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/playback/SleepTimerDialog.java)

**Evidence (Observed Behavior)**
- Boundary Crossing: 15
- Blast Radius (Clusters): 7
- Fan-Out: 16
- Fan-In: 0

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- storage/preferences/src/main/java/de/danoeh/antennapod/storage/preferences/SleepTimerType.java (1 edges - Type: UNKNOWN)
- BottomSheetDialogFragment (1 edges - Type: UNKNOWN)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/ThemeUtils.java (1 edges - Type: UNKNOWN)
- playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackController.java (1 edges - Type: UNKNOWN)
- ui/common/src/main/java/de/danoeh/antennapod/ui/common/Converter.java (1 edges - Type: UNKNOWN)
- storage/preferences/src/main/java/de/danoeh/antennapod/storage/preferences/SleepTimerPreferences.java (1 edges - Type: UNKNOWN)
- Single (1 edges - Type: UNKNOWN)
- storage/preferences/src/main/java/de/danoeh/antennapod/storage/preferences/UserPreferences.java (1 edges - Type: UNKNOWN)
- playback/service/src/main/java/de/danoeh/antennapod/playback/service/PlaybackService.java (1 edges - Type: UNKNOWN)
- storage/preferences/src/main/java/de/danoeh/antennapod/storage/preferences/PlaybackPreferences.java (1 edges - Type: UNKNOWN)


## 3. Evidence Layer
### 3.1 Ghost Evidence
*No ghost evidence found.*

### 3.2 Boundary Evidence
<details><summary><b>Show Boundary Evidence (Top 50)</b></summary>

- [app/src/main/java/de/danoeh/antennapod/ui/screen/drawer/NavigationNames.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/drawer/NavigationNames.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/AddFeedFragment.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/download/DownloadLogFragment.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/preferences/SwipePreferencesFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/preferences/SwipePreferencesFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/AllEpisodesFragment.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/episodeslist/FeedItemMenuHandler.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/episodeslist/FeedItemMenuHandler.java) -> app/src/main/java/de/danoeh/antennapod/ui/share/ShareUtils.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/swipeactions/SwipeActionsDialog.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/swipeactions/SwipeActionsDialog.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/FavoritesFragment.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/feed/FeedItemlistFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/feed/FeedItemlistFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/download/DownloadLogDetailsDialog.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/episodeslist/EpisodesListFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/episodeslist/EpisodesListFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/swipeactions/SwipeActions.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/preferences/SwipePreferencesFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/preferences/SwipePreferencesFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/queue/QueueFragment.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/download/DownloadLogAdapter.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/download/DownloadLogAdapter.java) -> app/src/main/java/de/danoeh/antennapod/actionbutton/DownloadActionButton.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/queue/QueueFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/queue/QueueFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/InboxFragment.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/AllEpisodesFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/AllEpisodesFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/AllEpisodesFilterDialog.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/feed/FeedItemlistFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/feed/FeedItemlistFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/FeedItemFilterDialog.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/download/CompletedDownloadsFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/download/CompletedDownloadsFragment.java) -> app/src/main/java/de/danoeh/antennapod/actionbutton/DeleteActionButton.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/episodeslist/HorizontalItemListAdapter.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/episodeslist/HorizontalItemListAdapter.java) -> app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java) -> app/src/main/java/de/danoeh/antennapod/ui/TransitionEffect.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/subscriptions/TagMenuHandler.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/subscriptions/TagMenuHandler.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/feed/RenameFeedDialog.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/subscriptions/FeedMenuHandler.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/subscriptions/FeedMenuHandler.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/feed/RemoveFeedDialog.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/SearchFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/SearchFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/episodeslist/EpisodeItemListRecyclerView.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/episode/ItemFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/episode/ItemFragment.java) -> app/src/main/java/de/danoeh/antennapod/actionbutton/PlayActionButton.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/subscriptions/SubscriptionsRecyclerAdapter.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/subscriptions/SubscriptionsRecyclerAdapter.java) -> app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/download/CompletedDownloadsFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/download/CompletedDownloadsFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/view/LiftOnScrollListener.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/download/CompletedDownloadsFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/download/CompletedDownloadsFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/MenuItemUtils.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/drawer/NavDrawerFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/drawer/NavDrawerFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/home/HomeFragment.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/actionbutton/StreamActionButton.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/actionbutton/StreamActionButton.java) -> app/src/main/java/de/danoeh/antennapod/actionbutton/ItemActionButton.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/drawer/NavDrawerFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/drawer/NavDrawerFragment.java) -> app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/SearchFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/SearchFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/MenuItemUtils.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/preferences/SwipePreferencesFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/preferences/SwipePreferencesFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/swipeactions/SwipeActionsDialog.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/rating/RatingDialogManager.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/episodeslist/EpisodeMultiSelectActionHandler.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/episodeslist/EpisodeMultiSelectActionHandler.java) -> app/src/main/java/de/danoeh/antennapod/ui/share/ShareDialog.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/swipeactions/RemoveFromInboxSwipeAction.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/swipeactions/RemoveFromInboxSwipeAction.java) -> app/src/main/java/de/danoeh/antennapod/ui/episodeslist/FeedItemMenuHandler.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/drawer/NavDrawerFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/drawer/NavDrawerFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/feed/RemoveFeedDialog.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/swipeactions/StartDownloadSwipeAction.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/swipeactions/StartDownloadSwipeAction.java) -> app/src/main/java/de/danoeh/antennapod/ui/swipeactions/SwipeAction.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/home/HomeSection.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/home/HomeSection.java) -> app/src/main/java/de/danoeh/antennapod/ui/episodeslist/FeedItemMenuHandler.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/episodeslist/HorizontalItemViewHolder.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/episodeslist/HorizontalItemViewHolder.java) -> app/src/main/java/de/danoeh/antennapod/ui/CoverLoader.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/AllEpisodesFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/AllEpisodesFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/feed/ItemSortDialog.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/episodeslist/HorizontalItemListAdapter.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/episodeslist/HorizontalItemListAdapter.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/episode/ItemPagerFragment.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/home/HomeFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/home/HomeFragment.java) -> app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/feed/FeedItemlistFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/feed/FeedItemlistFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/TransitionEffect.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/playback/VariableSpeedDialog.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/playback/VariableSpeedDialog.java) -> app/src/main/java/de/danoeh/antennapod/ui/view/ItemOffsetDecoration.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/episode/ItemFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/episode/ItemFragment.java) -> app/src/main/java/de/danoeh/antennapod/actionbutton/CancelDownloadActionButton.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/home/HomeSection.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/home/HomeSection.java) -> app/src/main/java/de/danoeh/antennapod/ui/episodeslist/EpisodeItemListAdapter.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/queue/QueueFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/queue/QueueFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/swipeactions/SwipeActions.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/drawer/NavigationNames.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/drawer/NavigationNames.java) -> app/src/main/java/de/danoeh/antennapod/ui/screen/InboxFragment.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/subscriptions/SubscriptionFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/subscriptions/SubscriptionFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/view/FloatingSelectMenu.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/episode/ItemFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/episode/ItemFragment.java) -> app/src/main/java/de/danoeh/antennapod/actionbutton/ItemActionButton.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/AddFeedFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/AddFeedFragment.java) -> app/src/main/java/de/danoeh/antennapod/activity/MainActivity.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/subscriptions/FeedMultiSelectActionHandler.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/subscriptions/FeedMultiSelectActionHandler.java) -> app/src/main/java/de/danoeh/antennapod/ui/share/ShareUtils.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/swipeactions/RemoveFromInboxSwipeAction.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/swipeactions/RemoveFromInboxSwipeAction.java) -> app/src/main/java/de/danoeh/antennapod/ui/swipeactions/SwipeAction.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/queue/QueueFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/queue/QueueFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/view/EmptyViewHandler.java (Count: 1)
- [app/src/main/java/de/danoeh/antennapod/ui/screen/queue/QueueFragment.java](vscode://file//home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/app/src/main/java/de/danoeh/antennapod/ui/screen/queue/QueueFragment.java) -> app/src/main/java/de/danoeh/antennapod/ui/episodeslist/FeedItemMenuHandler.java (Count: 1)
</details>

## 4. System Assembly Points (Healthy Hubs)
*No system assembly points identified.*

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

## 5. Knowledge Connectivity
*No knowledge sources linked.*

## 7. Architectural Reasoning
### Q4 Extension Points
- **Ghost Dependency (ghosts)** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 98 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 26 architectural clusters.
- **app/src/main/java/de/danoeh/antennapod/actionbutton/ItemActionButton.java** (Confidence: 1.00)
  - - 9 implementations
  - - [EXTENSION_DENSITY] Has 9 implementations.
- **app/src/main/java/de/danoeh/antennapod/ui/screen/feed/RemoveFeedDialog.java** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **AGGREGATE_folder_ui_common_src_main_java_de_danoeh_antennapod_ui_common** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **app/src/main/java/de/danoeh/antennapod/ui/swipeactions/SwipeAction.java** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 10 implementations.
- **app/src/main/java/de/danoeh/antennapod/ui/screen/feed/ItemSortDialog.java** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **app/src/main/java/de/danoeh/antennapod/ui/episodeslist/EpisodeItemListAdapter.java** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **app/src/main/java/de/danoeh/antennapod/ui/SelectableAdapter.java** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **app/src/main/java/de/danoeh/antennapod/ui/episodeslist/EpisodesListFragment.java** (Confidence: 0.90)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
- **AGGREGATE_folder_playback_base_src_main_java_de_danoeh_antennapod_playback_base** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **app/src/main/java/de/danoeh/antennapod/ui/screen/feed/ItemFilterDialog.java** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.

## 6. Raw Metrics
### 6.1 Global Metrics
- **Boundary Ratio**: 76.5%

### 6.2 Source Breakdown (ASR 3.0)
#### Ghost Source Top N
  - N/A

#### Coupling Source Top N
  - **app**: 886 (50%)
  - **external**: 246 (13.9%)
  - **model**: 218 (12.3%)
  - **storage**: 154 (8.7%)
  - **ui**: 108 (6.1%)
  - ...