# 🔬 SYNAPSE Architecture Scan Report (EV-LIVE)
Generated: 2026-08-20T08:56:00.186Z

## 0. Analysis Subject (Layer -3)
- **Subject**: Module: include/linux
- **Files**: 60943
- **Internal Edges**: 57695
- **Boundary Edges**: 190189

### Subject Fingerprint (Top Internal Domains)
- Module: include/linux
- Module: drivers/gpu/drm/amd/display
- Module: tools/testing/selftests/bpf/progs
- Module: drivers/gpu/drm/nouveau/nvkm
- Module: sound/soc/codecs

## 1. Executive Summary
**Scan Context**: Sub-cluster Analysis
**Observation**: External Dependency Ratio = 3.3x
**Assessment**: Selected cluster depends heavily on modules outside the scan boundary.
**Implication**: This does not imply whole-project instability.

**Why High External Coupling?**
- **Boundary Edge Count**: 190189 / 57695 (Internal)
- **Top 3 Contributors**: 상위 3개 파일(dev.c, fork.c, setup.c)이 전체 Boundary Edge의 **0.1%** (217개)를 생성하고 있습니다.



**Cumulative Boundary Contribution**
- **Top 3**: 0.1% (217 edges)
- **Top 10**: 0.3% (612 edges)
- **Top 50**: 1.1% (2150 edges)
- **Top 100**: 1.9% (3677 edges)

**Audit Confidence**: 85%

Base Score                     70
Grammar Noise Filtered        +0
Assembly Point Classified      +5
Contract Hub Verified          +4
Ghost Ratio < 5%               +6
Unknown References             0
Final Score                   85

### Global Metrics
- **Entropy**: 12
- **Ghost Dependencies**: 3693

### Dependency Sources Breakdown
**Ghost Dependencies (Scanner Issues)**
  - N/A

**External Dependencies (Architecture)**
  - N/A


## 2. Impact Files (Architectural Assessment)
### 1. drivers/net/ethernet/mellanox/mlx5/core/dev.c
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/net/ethernet/mellanox/mlx5/core/dev.c)

**Evidence (Observed Behavior)**
- Boundary Crossing: 75
- Blast Radius (Clusters): 141
- Fan-Out: 79
- Fan-In: 0

**Architectural Assessment**
> GOD_SERVICE: Centralized service object that handles too many responsibilities across domain boundaries.

**Risk Level**: CRITICAL

**Recommended Action**
> Decompose into smaller domain-specific services.

**Top External Targets (Evidence)**
- include/trace/events/napi.h (1 edges - Type: INCLUDE)
- include/linux/capability.h (1 edges - Type: INCLUDE)
- net/core/net-sysfs.c (1 edges - Type: INCLUDE)
- include/net/pkt_sched.h (1 edges - Type: INCLUDE)
- arch/loongarch/kvm/interrupt.c (1 edges - Type: INCLUDE)
- arch/s390/boot/ctype.c (1 edges - Type: INCLUDE)
- include/linux/prandom.h (1 edges - Type: INCLUDE)
- include/net/netdev_lock.h (1 edges - Type: INCLUDE)
- include/linux/netdevice.h (1 edges - Type: INCLUDE)
- drivers/gpu/host1x/dev.c (1 edges - Type: INCLUDE)

### 2. kernel/fork.c
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/kernel/fork.c)

**Evidence (Observed Behavior)**
- Boundary Crossing: 74
- Blast Radius (Clusters): 134
- Fan-Out: 74
- Fan-In: 0

**Architectural Assessment**
> EXCESSIVE_FAN_OUT: Component directly manages or orchestrates an excessive number of dependencies.

**Risk Level**: MEDIUM

**Recommended Action**
> Split responsibilities or apply Dependency Inversion Principle (DIP).

**Top External Targets (Evidence)**
- include/linux/rtmutex.h (1 edges - Type: INCLUDE)
- fs/fs_struct.c (1 edges - Type: INCLUDE)
- include/linux/oom.h (1 edges - Type: INCLUDE)
- include/linux/init_task.h (1 edges - Type: INCLUDE)
- drivers/net/ethernet/mellanox/mlx4/profile.c (1 edges - Type: INCLUDE)
- include/linux/io_uring.h (1 edges - Type: INCLUDE)
- include/uapi/linux/magic.h (1 edges - Type: INCLUDE)
- arch/s390/boot/kmsan.c (1 edges - Type: INCLUDE)
- include/linux/randomize_kstack.h (1 edges - Type: INCLUDE)
- include/linux/sched/exec_state.h (1 edges - Type: INCLUDE)

### 3. arch/alpha/kernel/setup.c
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/arch/alpha/kernel/setup.c)

**Evidence (Observed Behavior)**
- Boundary Crossing: 68
- Blast Radius (Clusters): 148
- Fan-Out: 72
- Fan-In: 0

**Architectural Assessment**
> EXCESSIVE_FAN_OUT: Component directly manages or orchestrates an excessive number of dependencies.

**Risk Level**: MEDIUM

**Recommended Action**
> Split responsibilities or apply Dependency Inversion Principle (DIP).

**Top External Targets (Evidence)**
- arch/arm64/kernel/cpuinfo.c (1 edges - Type: INCLUDE)
- include/linux/of_address.h (1 edges - Type: INCLUDE)
- include/kunit/platform_device.h (1 edges - Type: INCLUDE)
- include/linux/kmemleak.h (1 edges - Type: INCLUDE)
- include/linux/panic_notifier.h (1 edges - Type: INCLUDE)
- fs/configfs/mount.c (1 edges - Type: INCLUDE)
- drivers/pci/pcie/err.c (1 edges - Type: INCLUDE)
- include/linux/root_dev.h (1 edges - Type: INCLUDE)
- arch/loongarch/kvm/interrupt.c (1 edges - Type: INCLUDE)
- arch/sh/drivers/platform_early.c (1 edges - Type: INCLUDE)

### 4. security/selinux/hooks.c
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/security/selinux/hooks.c)

**Evidence (Observed Behavior)**
- Boundary Crossing: 63
- Blast Radius (Clusters): 144
- Fan-Out: 64
- Fan-In: 0

**Architectural Assessment**
> EXCESSIVE_FAN_OUT: Component directly manages or orchestrates an excessive number of dependencies.

**Risk Level**: MEDIUM

**Recommended Action**
> Split responsibilities or apply Dependency Inversion Principle (DIP).

**Top External Targets (Evidence)**
- drivers/net/wireless/ath/ath10k/swap.c (1 edges - Type: INCLUDE)
- include/linux/personality.h (1 edges - Type: INCLUDE)
- drivers/firmware/arm_scmi/msg.c (1 edges - Type: INCLUDE)
- security/selinux/include/initcalls.h (1 edges - Type: INCLUDE)
- include/linux/parser.h (1 edges - Type: INCLUDE)
- security/selinux/include/netnode.h (1 edges - Type: INCLUDE)
- drivers/net/wireless/intel/iwlwifi/mvm/quota.c (1 edges - Type: INCLUDE)
- include/linux/pagemap.h (1 edges - Type: INCLUDE)
- include/trace/events/avc.h (1 edges - Type: INCLUDE)
- include/linux/kernfs.h (1 edges - Type: INCLUDE)

### 5. rust/bindings/bindings_helper.h
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/rust/bindings/bindings_helper.h)

**Evidence (Observed Behavior)**
- Boundary Crossing: 59
- Blast Radius (Clusters): 131
- Fan-Out: 59
- Fan-In: 0

**Architectural Assessment**
> EXCESSIVE_FAN_OUT: Component directly manages or orchestrates an excessive number of dependencies.

**Risk Level**: MEDIUM

**Recommended Action**
> Split responsibilities or apply Dependency Inversion Principle (DIP).

**Top External Targets (Evidence)**
- drivers/md/dm-vdo/completion.c (1 edges - Type: INCLUDE)
- drivers/gpu/drm/drm_ioctl.c (1 edges - Type: INCLUDE)
- include/linux/pid_namespace.h (1 edges - Type: INCLUDE)
- include/linux/task_work.h (1 edges - Type: INCLUDE)
- include/trace/events/rust_sample.h (1 edges - Type: INCLUDE)
- drivers/gpu/drm/drm_file.c (1 edges - Type: INCLUDE)
- drivers/gpu/drm/drm_gem_shmem_helper.c (1 edges - Type: INCLUDE)
- include/linux/gpu_buddy.h (1 edges - Type: INCLUDE)
- arch/mips/fw/arc/file.c (1 edges - Type: INCLUDE)
- drivers/gpu/drm/drm_gem.c (1 edges - Type: INCLUDE)

### 6. kernel/sched/sched.h
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/kernel/sched/sched.h)

**Evidence (Observed Behavior)**
- Boundary Crossing: 58
- Blast Radius (Clusters): 110
- Fan-Out: 60
- Fan-In: 1

**Architectural Assessment**
> EXCESSIVE_FAN_OUT: Component directly manages or orchestrates an excessive number of dependencies.

**Risk Level**: MEDIUM

**Recommended Action**
> Split responsibilities or apply Dependency Inversion Principle (DIP).

**Top External Targets (Evidence)**
- include/linux/vmstat.h (1 edges - Type: INCLUDE)
- include/linux/kref_api.h (1 edges - Type: INCLUDE)
- include/linux/jiffies.h (1 edges - Type: INCLUDE)
- fs/seq_file.c (1 edges - Type: INCLUDE)
- include/linux/workqueue_api.h (1 edges - Type: INCLUDE)
- include/linux/static_key.h (1 edges - Type: INCLUDE)
- drivers/scsi/isci/task.c (1 edges - Type: INCLUDE)
- include/linux/spinlock_api.h (1 edges - Type: INCLUDE)
- arch/arm/mm/mm.h (1 edges - Type: INCLUDE)
- include/linux/cpuset.h (1 edges - Type: INCLUDE)

### 7. net/core/filter.c
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/net/core/filter.c)

**Evidence (Observed Behavior)**
- Boundary Crossing: 57
- Blast Radius (Clusters): 96
- Fan-Out: 57
- Fan-In: 0

**Architectural Assessment**
> GOD_SERVICE: Centralized service object that handles too many responsibilities across domain boundaries.

**Risk Level**: CRITICAL

**Recommended Action**
> Decompose into smaller domain-specific services.

**Top External Targets (Evidence)**
- include/linux/if_vlan.h (1 edges - Type: INCLUDE)
- include/kunit/skbuff.h (1 edges - Type: INCLUDE)
- drivers/net/ovpn/udp.c (1 edges - Type: INCLUDE)
- include/net/bpf_sk_storage.h (1 edges - Type: INCLUDE)
- include/net/xdp_sock.h (1 edges - Type: INCLUDE)
- include/linux/if_arp.h (1 edges - Type: INCLUDE)
- include/linux/inet.h (1 edges - Type: INCLUDE)
- include/net/flow.h (1 edges - Type: INCLUDE)
- include/net/transp_v6.h (1 edges - Type: INCLUDE)
- include/linux/skmsg.h (1 edges - Type: INCLUDE)

### 8. drivers/gpu/drm/i915/i915_driver.c
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/i915/i915_driver.c)

**Evidence (Observed Behavior)**
- Boundary Crossing: 53
- Blast Radius (Clusters): 112
- Fan-Out: 89
- Fan-In: 11

**Architectural Assessment**
> NORMAL: Standard node behavior without severe structural anomalies.

**Risk Level**: NONE

**Recommended Action**
> No immediate architectural action required.

**Top External Targets (Evidence)**
- drivers/gpu/drm/i915/gem/i915_gem_ioctls.h (1 edges - Type: INCLUDE)
- drivers/gpu/drm/i915/gem/i915_gem_create.c (1 edges - Type: INCLUDE)
- drivers/gpu/drm/i915/display/intel_fbdev.c (1 edges - Type: INCLUDE)
- drivers/gpu/drm/i915/display/intel_encoder.c (1 edges - Type: INCLUDE)
- drivers/gpu/drm/i915/pxp/intel_pxp.c (1 edges - Type: INCLUDE)
- include/linux/oom.h (1 edges - Type: INCLUDE)
- drivers/gpu/drm/i915/display/intel_dmc.c (1 edges - Type: INCLUDE)
- drivers/gpu/drm/i915/pxp/intel_pxp_debugfs.c (1 edges - Type: INCLUDE)
- drivers/gpu/drm/drm_managed.c (1 edges - Type: INCLUDE)
- drivers/gpu/drm/drm_client_event.c (1 edges - Type: INCLUDE)

### 9. kernel/sched/core.c
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/kernel/sched/core.c)

**Evidence (Observed Behavior)**
- Boundary Crossing: 53
- Blast Radius (Clusters): 110
- Fan-Out: 54
- Fan-In: 0

**Architectural Assessment**
> EXCESSIVE_FAN_OUT: Component directly manages or orchestrates an excessive number of dependencies.

**Risk Level**: MEDIUM

**Recommended Action**
> Split responsibilities or apply Dependency Inversion Principle (DIP).

**Top External Targets (Evidence)**
- arch/loongarch/kvm/intc/ipi.c (1 edges - Type: INCLUDE)
- include/linux/sched/cond_resched.h (1 edges - Type: INCLUDE)
- include/linux/refcount_api.h (1 edges - Type: INCLUDE)
- include/linux/pgtable_api.h (1 edges - Type: INCLUDE)
- include/linux/sched/wake_q.h (1 edges - Type: INCLUDE)
- include/linux/rseq.h (1 edges - Type: INCLUDE)
- include/linux/livepatch_sched.h (1 edges - Type: INCLUDE)
- block/ioprio.c (1 edges - Type: INCLUDE)
- kernel/locking/mutex.h (1 edges - Type: INCLUDE)
- include/linux/wait_bit.h (1 edges - Type: INCLUDE)

### 10. kernel/exit.c
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/kernel/exit.c)

**Evidence (Observed Behavior)**
- Boundary Crossing: 52
- Blast Radius (Clusters): 128
- Fan-Out: 52
- Fan-In: 0

**Architectural Assessment**
> EXCESSIVE_FAN_OUT: Component directly manages or orchestrates an excessive number of dependencies.

**Risk Level**: MEDIUM

**Recommended Action**
> Split responsibilities or apply Dependency Inversion Principle (DIP).

**Top External Targets (Evidence)**
- drivers/scsi/isci/task.c (1 edges - Type: INCLUDE)
- include/linux/kcov.h (1 edges - Type: INCLUDE)
- fs/ecryptfs/kthread.c (1 edges - Type: INCLUDE)
- drivers/connector/cn_proc.c (1 edges - Type: INCLUDE)
- arch/alpha/kernel/audit.c (1 edges - Type: INCLUDE)
- include/linux/iocontext.h (1 edges - Type: INCLUDE)
- drivers/md/dm-vdo/completion.c (1 edges - Type: INCLUDE)
- include/linux/mutex.h (1 edges - Type: INCLUDE)
- include/linux/personality.h (1 edges - Type: INCLUDE)
- include/linux/delayacct.h (1 edges - Type: INCLUDE)


## 3. Evidence Layer
### 3.1 Ghost Evidence
*No ghost evidence found.*

### 3.2 Boundary Evidence
<details><summary><b>Show Boundary Evidence (Top 50)</b></summary>

- [drivers/power/supply/chagall-battery.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/power/supply/chagall-battery.c) -> drivers/pci/pcie/err.c (Count: 1)
- [drivers/regulator/act8865-regulator.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/regulator/act8865-regulator.c) -> include/dt-bindings/regulator/active-semi,8865-regulator.h (Count: 1)
- [arch/x86/kernel/apic/msi.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/arch/x86/kernel/apic/msi.c) -> drivers/iommu/intel/dmar.c (Count: 1)
- [drivers/gpu/drm/hisilicon/hibmc/hibmc_drm_debugfs.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/hisilicon/hibmc/hibmc_drm_debugfs.c) -> arch/x86/kernel/cpu/debugfs.c (Count: 1)
- [net/sunrpc/auth_gss/auth_gss.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/net/sunrpc/auth_gss/auth_gss.c) -> net/sunrpc/auth_gss/auth_gss_internal.h (Count: 1)
- [sound/soc/mediatek/mt8192/mt8192-afe-clk.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/sound/soc/mediatek/mt8192/mt8192-afe-clk.c) -> sound/soc/mediatek/mt8192/mt8192-afe-common.h (Count: 1)
- [drivers/net/vrf.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/net/vrf.c) -> include/net/route.h (Count: 1)
- [drivers/mfd/stmpe-spi.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/mfd/stmpe-spi.c) -> drivers/mfd/stmpe.c (Count: 1)
- [drivers/net/dsa/mv88e6xxx/pcs-6185.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/net/dsa/mv88e6xxx/pcs-6185.c) -> arch/um/drivers/port.h (Count: 1)
- [drivers/staging/media/atomisp/pci/isp/kernels/fixedbds/fixedbds_1.0/ia_css_fixedbds_param.h](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/staging/media/atomisp/pci/isp/kernels/fixedbds/fixedbds_1.0/ia_css_fixedbds_param.h) -> drivers/staging/media/atomisp/pci/hive_isp_css_include/type_support.h (Count: 1)
- [drivers/gpu/drm/radeon/radeon_mn.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/radeon/radeon_mn.c) -> arch/arm/common/firmware.c (Count: 1)
- [drivers/resctrl/mpam_resctrl.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/resctrl/mpam_resctrl.c) -> include/linux/rculist.h (Count: 1)
- [drivers/tty/serial/sc16is7xx.h](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/tty/serial/sc16is7xx.h) -> drivers/base/regmap/regmap.c (Count: 1)
- [tools/testing/selftests/bpf/progs/cg_storage_multi_isolated.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/tools/testing/selftests/bpf/progs/cg_storage_multi_isolated.c) -> tools/testing/selftests/bpf/prog_tests/cg_storage_multi.c (Count: 1)
- [drivers/net/phy/microchip.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/net/phy/microchip.c) -> arch/mips/ralink/of.c (Count: 1)
- [drivers/gpu/drm/nouveau/nvkm/engine/fifo/runl.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/nouveau/nvkm/engine/fifo/runl.c) -> drivers/gpu/drm/nouveau/include/nvkm/subdev/top.h (Count: 1)
- [drivers/gpu/drm/nouveau/nvkm/subdev/pmu/gk20a.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/nouveau/nvkm/subdev/pmu/gk20a.c) -> drivers/gpu/drm/nouveau/include/nvkm/subdev/bios/volt.h (Count: 1)
- [drivers/gpu/drm/amd/display/dc/resource/dcn30/dcn30_resource.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/amd/display/dc/resource/dcn30/dcn30_resource.c) -> drivers/gpu/drm/amd/display/include/irq_service_interface.h (Count: 1)
- [drivers/clk/ingenic/jz4725b-cgu.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/clk/ingenic/jz4725b-cgu.c) -> include/dt-bindings/clock/ingenic,jz4725b-cgu.h (Count: 1)
- [drivers/net/bonding/bond_main.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/net/bonding/bond_main.c) -> include/linux/rculist.h (Count: 1)
- [drivers/net/ethernet/aquantia/atlantic/aq_nic.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/net/ethernet/aquantia/atlantic/aq_nic.c) -> drivers/net/ethernet/aquantia/atlantic/aq_main.c (Count: 1)
- [fs/dcache.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/fs/dcache.c) -> include/linux/bit_spinlock.h (Count: 1)
- [drivers/media/usb/gspca/kinect.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/media/usb/gspca/kinect.c) -> drivers/media/usb/gspca/gspca.c (Count: 1)
- [drivers/gpu/drm/tegra/gr2d.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/tegra/gr2d.c) -> drivers/gpu/drm/gma500/gem.c (Count: 1)
- [drivers/platform/x86/amd/pmf/tee-if.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/platform/x86/amd/pmf/tee-if.c) -> include/linux/uuid.h (Count: 1)
- [drivers/accel/habanalabs/include/goya/asic_reg/goya_regs.h](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/accel/habanalabs/include/goya/asic_reg/goya_regs.h) -> drivers/accel/habanalabs/include/goya/asic_reg/sram_y0_x3_rtr_regs.h (Count: 1)
- [fs/xfs/xfs_export.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/fs/xfs/xfs_export.c) -> fs/xfs/libxfs/xfs_trans_resv.c (Count: 1)
- [kernel/fork.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/kernel/fork.c) -> include/linux/rtmutex.h (Count: 1)
- [net/openvswitch/flow_netlink.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/net/openvswitch/flow_netlink.c) -> include/net/ndisc.h (Count: 1)
- [tools/testing/selftests/net/forwarding/router.sh](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/tools/testing/selftests/net/forwarding/router.sh) -> arch/parisc/math-emu/fpudispatch.c (Count: 1)
- [drivers/net/ethernet/meta/fbnic/fbnic_txrx.h](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/net/ethernet/meta/fbnic/fbnic_txrx.h) -> include/kunit/skbuff.h (Count: 1)
- [drivers/media/usb/dvb-usb-v2/af9015.h](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/media/usb/dvb-usb-v2/af9015.h) -> drivers/media/tuners/qt1010.c (Count: 1)
- [arch/arm/mach-omap2/voltage.h](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/arch/arm/mach-omap2/voltage.h) -> include/linux/platform_data/voltage-omap.h (Count: 1)
- [drivers/usb/storage/usb.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/usb/storage/usb.c) -> include/scsi/scsi_cmnd.h (Count: 1)
- [fs/ext2/inode.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/fs/ext2/inode.c) -> include/linux/quotaops.h (Count: 1)
- [drivers/md/dm-path-selector.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/md/dm-path-selector.c) -> include/linux/device-mapper.h (Count: 1)
- [drivers/md/dm-stripe.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/md/dm-stripe.c) -> block/bio.c (Count: 1)
- [drivers/media/platform/mediatek/vcodec/encoder/mtk_vcodec_enc_drv.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/media/platform/mediatek/vcodec/encoder/mtk_vcodec_enc_drv.c) -> arch/mips/ralink/of.c (Count: 1)
- [drivers/staging/media/ipu3/ipu3-css.h](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/staging/media/ipu3/ipu3-css.h) -> drivers/staging/media/ipu3/ipu3-abi.h (Count: 1)
- [sound/hda/core/component.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/sound/hda/core/component.c) -> include/sound/hdaudio.h (Count: 1)
- [include/linux/firmware/trusted_foundations.h](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/include/linux/firmware/trusted_foundations.h) -> arch/mips/ralink/of.c (Count: 1)
- [drivers/irqchip/irqchip.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/irqchip/irqchip.c) -> include/linux/of_irq.h (Count: 1)
- [kernel/auditsc.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/kernel/auditsc.c) -> arch/alpha/kernel/time.c (Count: 1)
- [drivers/gpu/drm/logicvc/logicvc_interface.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/logicvc/logicvc_interface.c) -> drivers/gpu/drm/drm_print.c (Count: 1)
- [tools/perf/util/thread.h](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/tools/perf/util/thread.h) -> tools/perf/util/symbol_conf.h (Count: 1)
- [arch/arm64/kernel/alternative.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/arch/arm64/kernel/alternative.c) -> arch/s390/boot/printk.c (Count: 1)
- [arch/powerpc/xmon/xmon.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/arch/powerpc/xmon/xmon.c) -> arch/powerpc/boot/opal.c (Count: 1)
- [drivers/crypto/ccree/cc_request_mgr.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/crypto/ccree/cc_request_mgr.c) -> drivers/crypto/ccree/cc_driver.c (Count: 1)
- [sound/isa/gus/gusclassic.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/sound/isa/gus/gusclassic.c) -> arch/arm/mach-highbank/core.h (Count: 1)
- [drivers/md/dm-vdo/errors.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/md/dm-vdo/errors.c) -> drivers/md/dm-vdo/string-utils.c (Count: 1)
</details>

## 4. System Assembly Points (Healthy Hubs)
- [init/main.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/init/main.c) (Role: ASSEMBLY_POINT)
- [drivers/fwctl/mlx5/main.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/fwctl/mlx5/main.c) (Role: ASSEMBLY_POINT)
- [drivers/net/bonding/bond_main.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/net/bonding/bond_main.c) (Role: ASSEMBLY_POINT)
- [drivers/net/ethernet/freescale/fec_main.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/net/ethernet/freescale/fec_main.c) (Role: ASSEMBLY_POINT)
- [fs/nfs/client.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/fs/nfs/client.c) (Role: ASSEMBLY_POINT)
- [kernel/module/main.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/kernel/module/main.c) (Role: ASSEMBLY_POINT)

### 4.1 ASSEMBLY_POINT Audit
arch/alpha/boot/main.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
arch/arm/mach-davinci/pm_domain.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
arch/arm/mach-omap2/clockdomain.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
arch/arm/mach-omap2/powerdomain.c
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.30

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
arch/arm64/kvm/hyp/nvhe/hyp-main.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
arch/loongarch/kvm/main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
arch/powerpc/platforms/pseries/hvcserver.c
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
arch/s390/boot/startup.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.40

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
arch/um/os-Linux/main.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
arch/x86/boot/startup/sev-startup.c
Verdict: ACCEPTED

Evidence
FanOut: 13
Boundary Ratio: 0.92

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
arch/x86/hyperv/irqdomain.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
arch/x86/kernel/cpu/sgx/main.c
Verdict: ACCEPTED

Evidence
FanOut: 18
Boundary Ratio: 0.94

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
arch/x86/kvm/vmx/main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
arch/x86/realmode/rm/wakemain.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/accessibility/speakup/main.c
Verdict: ACCEPTED

Evidence
FanOut: 17
Boundary Ratio: 0.82

Reason Code:
ACCEPTED

---
drivers/acpi/container.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/android/binder/rust_binder_main.rs
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.55

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/base/attribute_container.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/base/container.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/base/firmware_loader/builtin/main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/base/firmware_loader/main.c
Verdict: ACCEPTED

Evidence
FanOut: 22
Boundary Ratio: 0.95

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/base/power/main.c
Verdict: ACCEPTED

Evidence
FanOut: 20
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/bcma/main.c
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/block/aoe/aoemain.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/block/drbd/drbd_main.c
Verdict: REJECTED

Evidence
FanOut: 23
Boundary Ratio: 0.78

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/block/null_blk/main.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/bluetooth/btmrvl_main.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/bus/mhi/ep/main.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/bus/mhi/host/main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/char/ipmi/kcs_bmc_client.h
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/char/tpm/tpm_tis_spi_main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/clk/at91/clk-main.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/clk/ti/clockdomain.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/comedi/kcomedilib/kcomedilib_main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/cpuidle/cpuidle-psci-domain.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.60

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/crypto/cavium/cpt/cptpf_main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/crypto/cavium/cpt/cptvf_main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/crypto/cavium/nitrox/nitrox_main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.33

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/crypto/ccp/ccp-crypto-main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/crypto/hisilicon/hpre/hpre_main.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/crypto/hisilicon/sec2/sec_main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/crypto/hisilicon/zip/dae_main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/crypto/hisilicon/zip/zip_main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/crypto/inside-secure/eip93/eip93-main.c
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.46

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/crypto/intel/iaa/iaa_crypto_main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/crypto/intel/qat/qat_common/adf_cfg_services.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.40

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/crypto/intel/qat/qat_common/adf_cfg_services.h
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/crypto/marvell/octeontx/otx_cptpf_main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/crypto/marvell/octeontx/otx_cptvf_main.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.25

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/crypto/marvell/octeontx2/otx2_cptpf_main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.33

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/crypto/marvell/octeontx2/otx2_cptvf_main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.17

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/crypto/tegra/tegra-se-main.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/dibs/dibs_main.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/dma/fsl-edma-main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/dma/mcf-edma-main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.60

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/firmware/qcom/qcom_qseecom_uefisecapp.c
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.63

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/fpga/dfl-afu-main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/fpga/dfl-fme-main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/fwctl/bnxt/main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/fwctl/main.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/fwctl/mlx5/main.c
Verdict: ACCEPTED

Evidence
FanOut: 50
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/fwctl/pds/main.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/gpu/drm/amd/display/amdgpu_dm/amdgpu_dm_services.c
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/amd/display/dc/dm_services.h
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/amd/display/dc/gpio/gpio_service.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/amd/display/dc/gpio/gpio_service.h
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/amd/display/dc/inc/link_service.h
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/amd/display/dc/irq/irq_service.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/amd/display/dc/irq/irq_service.h
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/clients/drm_fbdev_client.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/gpu/drm/drm_client.c
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.38

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/i915/gem/i915_gem_domain.c
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.40

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/i915/i915_drm_client.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/i915/i915_drm_client.h
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/imagination/pvr_rogue_cr_defs_client.h
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/imagination/pvr_rogue_fwif_client.h
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/nouveau/include/nvif/client.h
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/nouveau/include/nvkm/core/client.h
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/nouveau/nvif/client.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/gpu/drm/nouveau/nvkm/core/client.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/gpu/drm/nouveau/nvkm/subdev/gsp/rm/client.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/gpu/drm/nouveau/nvkm/subdev/gsp/rm/r535/client.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/gpu/drm/nouveau/nvkm/subdev/gsp/rm/r535/nvrm/client.h
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/gpu/drm/nouveau/nvkm/subdev/gsp/rm/r570/client.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/gpu/drm/scheduler/sched_main.c
Verdict: ACCEPTED

Evidence
FanOut: 12
Boundary Ratio: 0.83

Reason Code:
ACCEPTED

---
drivers/gpu/drm/udl/udl_main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/vboxvideo/vbox_main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/xe/xe_drm_client.c
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.25

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/xe/xe_drm_client.h
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/gpu/drm/xe/xe_gt_sriov_pf_service.c
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.33

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/xe/xe_gt_sriov_pf_service.h
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/xe/xe_sriov_pf_service.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.29

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/gpu/drm/xe/xe_sriov_pf_service.h
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/hid/amd-sfh-hid/amd_sfh_client.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.40

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/hid/intel-ish-hid/ishtp-hid-client.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/hid/intel-ish-hid/ishtp/client.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/hid/intel-ish-hid/ishtp/client.h
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/hv/mshv_root_main.c
Verdict: ACCEPTED

Evidence
FanOut: 18
Boundary Ratio: 0.83

Reason Code:
ACCEPTED

---
drivers/hv/mshv_vtl_main.c
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.79

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/infiniband/core/uverbs_main.c
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/infiniband/hw/bnxt_re/main.c
Verdict: REJECTED

Evidence
FanOut: 24
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/infiniband/hw/efa/efa_main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/infiniband/hw/erdma/erdma_main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.40

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/infiniband/hw/hfi1/ipoib_main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/infiniband/hw/hns/hns_roce_main.c
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/infiniband/hw/irdma/main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/infiniband/hw/mana/main.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/infiniband/hw/mlx4/main.c
Verdict: ACCEPTED

Evidence
FanOut: 25
Boundary Ratio: 0.92

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/infiniband/hw/mthca/mthca_main.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.14

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/infiniband/hw/ocrdma/ocrdma_main.c
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.64

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/infiniband/hw/qedr/main.c
Verdict: ACCEPTED

Evidence
FanOut: 13
Boundary Ratio: 0.85

Reason Code:
ACCEPTED

---
drivers/infiniband/hw/usnic/usnic_ib_main.c
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.27

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/infiniband/hw/vmw_pvrdma/pvrdma_main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/infiniband/sw/siw/siw_main.c
Verdict: ACCEPTED

Evidence
FanOut: 13
Boundary Ratio: 0.85

Reason Code:
ACCEPTED

---
drivers/infiniband/ulp/ipoib/ipoib_main.c
Verdict: ACCEPTED

Evidence
FanOut: 11
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/input/joystick/iforce/iforce-main.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/interconnect/debugfs-client.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/iommu/fsl_pamu_domain.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/iommu/iommufd/main.c
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.63

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/irqchip/irq-riscv-aplic-main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/media/common/siano/smsdvb-main.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.57

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/media/pci/cobalt/cobalt-alsa-main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/media/pci/cx18/cx18-alsa-main.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.43

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/media/pci/ddbridge/ddbridge-main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.44

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/media/pci/ivtv/ivtv-alsa-main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.33

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/media/pci/smipcie/smipcie-main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/media/rc/rc-main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/media/usb/pvrusb2/pvrusb2-main.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.14

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/misc/mei/client.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/misc/mei/client.h
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/misc/mei/main.c
Verdict: ACCEPTED

Evidence
FanOut: 24
Boundary Ratio: 0.96

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/misc/ocxl/main.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/misc/sgi-gru/grukservices.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.56

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/misc/sgi-gru/grukservices.h
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/misc/sgi-gru/grumain.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/misc/sgi-xp/xp_main.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/misc/sgi-xp/xpc_main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/mtd/nand/raw/bcm47xxnflash/main.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/bonding/bond_main.c
Verdict: ACCEPTED

Evidence
FanOut: 39
Boundary Ratio: 0.95

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/net/can/c_can/c_can_main.c
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/net/can/peak_canfd/peak_pciefd_main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/can/softing/softing_main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/dsa/microchip/lan937x_main.c
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.62

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/dsa/netc/netc_main.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/net/dsa/realtek/rtl8365mb_main.c
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.58

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/dsa/sja1105/sja1105_main.c
Verdict: ACCEPTED

Evidence
FanOut: 14
Boundary Ratio: 0.86

Reason Code:
ACCEPTED

---
drivers/net/ethernet/altera/altera_tse_main.c
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 0.79

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/amd/pds_core/main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/net/ethernet/amd/xgbe/xgbe-main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.60

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/apm/xgene-v2/main.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/net/ethernet/apm/xgene/xgene_enet_main.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.25

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/aquantia/atlantic/aq_main.c
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.53

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/arc/emac_main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/net/ethernet/asix/ax88796c_main.c
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/net/ethernet/atheros/alx/main.c
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/net/ethernet/atheros/atl1c/atl1c_main.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/atheros/atl1e/atl1e_main.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/broadcom/bnx2x/bnx2x_main.c
Verdict: REJECTED

Evidence
FanOut: 31
Boundary Ratio: 0.74

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/cadence/macb_main.c
Verdict: ACCEPTED

Evidence
FanOut: 26
Boundary Ratio: 0.96

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/net/ethernet/cavium/liquidio/lio_main.c
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 0.22

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/cavium/liquidio/lio_vf_main.c
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.18

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/cavium/thunder/nic_main.c
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/cavium/thunder/nicvf_main.c
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.73

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/chelsio/cxgb3/cxgb3_main.c
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 0.72

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/chelsio/cxgb4/cxgb4_main.c
Verdict: REJECTED

Evidence
FanOut: 44
Boundary Ratio: 0.59

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/chelsio/cxgb4vf/cxgb4vf_main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.78

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/cisco/enic/enic_main.c
Verdict: REJECTED

Evidence
FanOut: 31
Boundary Ratio: 0.61

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/emulex/benet/be_main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.60

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/engleder/tsnep_main.c
Verdict: ACCEPTED

Evidence
FanOut: 13
Boundary Ratio: 0.85

Reason Code:
ACCEPTED

---
drivers/net/ethernet/freescale/fec_main.c
Verdict: ACCEPTED

Evidence
FanOut: 32
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/net/ethernet/freescale/fs_enet/fs_enet-main.c
Verdict: ACCEPTED

Evidence
FanOut: 15
Boundary Ratio: 0.93

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/net/ethernet/fungible/funeth/funeth_main.c
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/google/gve/gve_main.c
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 0.74

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/hisilicon/hibmcge/hbg_main.c
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.31

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/hisilicon/hns/hns_dsaf_main.c
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.64

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/hisilicon/hns3/hns3pf/hclge_main.c
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 0.37

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/hisilicon/hns3/hns3vf/hclgevf_main.c
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.30

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/huawei/hinic/hinic_main.c
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/huawei/hinic3/hinic3_main.c
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.15

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/ibm/ehea/ehea_main.c
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/intel/e1000/e1000_main.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/intel/fm10k/fm10k_main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/intel/i40e/i40e_client.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/intel/i40e/i40e_main.c
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/intel/iavf/iavf_main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.33

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/intel/ice/ice_main.c
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.25

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/intel/idpf/idpf_main.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/intel/igb/igb_main.c
Verdict: ACCEPTED

Evidence
FanOut: 22
Boundary Ratio: 0.95

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/net/ethernet/intel/igc/igc_main.c
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.69

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/intel/ixgbe/ixgbe_main.c
Verdict: REJECTED

Evidence
FanOut: 37
Boundary Ratio: 0.76

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/intel/ixgbevf/ixgbevf_main.c
Verdict: ACCEPTED

Evidence
FanOut: 14
Boundary Ratio: 0.93

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/net/ethernet/marvell/mvpp2/mvpp2_main.c
Verdict: ACCEPTED

Evidence
FanOut: 27
Boundary Ratio: 0.89

Reason Code:
ACCEPTED

---
drivers/net/ethernet/marvell/octeon_ep_vf/octep_vf_main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/net/ethernet/marvell/octeon_ep/octep_main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/marvell/prestera/prestera_main.c
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 0.41

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/mellanox/mlx4/en_main.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/mellanox/mlx5/core/en_main.c
Verdict: REJECTED

Evidence
FanOut: 42
Boundary Ratio: 0.57

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/mellanox/mlx5/core/main.c
Verdict: REJECTED

Evidence
FanOut: 35
Boundary Ratio: 0.43

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/mellanox/mlx5/core/steering/sws/dr_domain.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.33

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/mellanox/mlxbf_gige/mlxbf_gige_main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.78

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/microchip/lan743x_main.c
Verdict: ACCEPTED

Evidence
FanOut: 14
Boundary Ratio: 0.93

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/net/ethernet/microchip/lan966x/lan966x_main.c
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/net/ethernet/microchip/sparx5/sparx5_main.c
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/microchip/vcap/vcap_api_client.h
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/microsoft/mana/gdma_main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/net/ethernet/mucse/rnpgbe/rnpgbe_main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.40

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/netronome/nfp/abm/main.c
Verdict: ACCEPTED

Evidence
FanOut: 15
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/net/ethernet/netronome/nfp/bpf/main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.22

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/netronome/nfp/flower/main.c
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.36

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/netronome/nfp/nfp_app.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.33

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/netronome/nfp/nfp_main.c
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.18

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/netronome/nfp/nfp_net_main.c
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 0.29

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/netronome/nfp/nfp_netvf_main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.20

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/netronome/nfp/nic/main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.17

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/oki-semi/pch_gbe/pch_gbe_main.c
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/pensando/ionic/ionic_main.c
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.60

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/qlogic/netxen/netxen_nic_main.c
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/qlogic/qed/qed_main.c
Verdict: REJECTED

Evidence
FanOut: 21
Boundary Ratio: 0.38

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/qlogic/qede/qede_main.c
Verdict: ACCEPTED

Evidence
FanOut: 19
Boundary Ratio: 0.89

Reason Code:
ACCEPTED

---
drivers/net/ethernet/qlogic/qlcnic/qlcnic_main.c
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.70

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/realtek/r8169_main.c
Verdict: ACCEPTED

Evidence
FanOut: 17
Boundary Ratio: 0.88

Reason Code:
ACCEPTED

---
drivers/net/ethernet/realtek/rtase/rtase_main.c
Verdict: ACCEPTED

Evidence
FanOut: 17
Boundary Ratio: 0.94

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/net/ethernet/renesas/ravb_main.c
Verdict: ACCEPTED

Evidence
FanOut: 15
Boundary Ratio: 0.93

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/net/ethernet/renesas/rswitch_main.c
Verdict: ACCEPTED

Evidence
FanOut: 17
Boundary Ratio: 0.88

Reason Code:
ACCEPTED

---
drivers/net/ethernet/rocker/rocker_main.c
Verdict: ACCEPTED

Evidence
FanOut: 23
Boundary Ratio: 0.87

Reason Code:
ACCEPTED

---
drivers/net/ethernet/samsung/sxgbe/sxgbe_main.c
Verdict: REJECTED

Evidence
FanOut: 21
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/stmicro/stmmac/stmmac_main.c
Verdict: REJECTED

Evidence
FanOut: 33
Boundary Ratio: 0.76

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/wangxun/ngbe/ngbe_main.c
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.73

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/wangxun/ngbevf/ngbevf_main.c
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/net/ethernet/wangxun/txgbe/txgbe_main.c
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 0.63

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ethernet/wangxun/txgbevf/txgbevf_main.c
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/net/ethernet/xilinx/ll_temac_main.c
Verdict: ACCEPTED

Evidence
FanOut: 20
Boundary Ratio: 0.95

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/net/ethernet/xilinx/xilinx_axienet_main.c
Verdict: ACCEPTED

Evidence
FanOut: 18
Boundary Ratio: 0.94

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/net/fjes/fjes_main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ipa/ipa_main.c
Verdict: REJECTED

Evidence
FanOut: 22
Boundary Ratio: 0.32

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ipvlan/ipvlan_main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/ovpn/main.c
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/phy/aquantia/aquantia_main.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/phy/mscc/mscc_main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.78

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/phy/realtek/realtek_main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/net/thunderbolt/main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/net/wireguard/main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/ath/ath6kl/main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.40

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/ath/ath9k/htc_drv_main.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/net/wireless/ath/ath9k/main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/ath/carl9170/main.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/net/wireless/ath/main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/ath/wcn36xx/main.c
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/net/wireless/ath/wil6210/main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/broadcom/b43/main.c
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 0.72

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/broadcom/b43legacy/main.c
Verdict: ACCEPTED

Evidence
FanOut: 15
Boundary Ratio: 0.87

Reason Code:
ACCEPTED

---
drivers/net/wireless/broadcom/brcm80211/brcmsmac/main.c
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 0.37

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/intel/iwlwifi/dvm/main.c
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.44

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/intersil/p54/main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.60

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/marvell/libertas_tf/main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/marvell/libertas/main.c
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.77

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/marvell/mwifiex/main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.60

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/mediatek/mt76/mt7603/main.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/mediatek/mt76/mt7615/main.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.33

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/mediatek/mt76/mt76x0/main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/mediatek/mt76/mt76x2/pci_main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/mediatek/mt76/mt76x2/usb_main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/mediatek/mt76/mt7915/main.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/mediatek/mt76/mt7921/main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/mediatek/mt76/mt7925/main.c
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/mediatek/mt76/mt7996/main.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.33

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/mediatek/mt7601u/main.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/realtek/rtlwifi/rtl8192c/main.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/realtek/rtlwifi/rtl8192d/main.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/realtek/rtlwifi/rtl8723com/main.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/realtek/rtw88/main.c
Verdict: ACCEPTED

Evidence
FanOut: 15
Boundary Ratio: 0.87

Reason Code:
ACCEPTED

---
drivers/net/wireless/rsi/rsi_91x_main.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.29

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/silabs/wfx/main.c
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 0.68

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/net/wireless/st/cw1200/main.c
Verdict: ACCEPTED

Evidence
FanOut: 15
Boundary Ratio: 0.87

Reason Code:
ACCEPTED

---
drivers/net/wireless/ti/wl1251/main.c
Verdict: ACCEPTED

Evidence
FanOut: 13
Boundary Ratio: 0.85

Reason Code:
ACCEPTED

---
drivers/net/wireless/ti/wl12xx/main.c
Verdict: ACCEPTED

Evidence
FanOut: 16
Boundary Ratio: 0.94

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/net/wireless/ti/wl18xx/main.c
Verdict: ACCEPTED

Evidence
FanOut: 19
Boundary Ratio: 0.95

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/net/wireless/ti/wlcore/main.c
Verdict: ACCEPTED

Evidence
FanOut: 16
Boundary Ratio: 0.88

Reason Code:
ACCEPTED

---
drivers/net/wireless/virtual/mac80211_hwsim_main.c
Verdict: ACCEPTED

Evidence
FanOut: 19
Boundary Ratio: 0.89

Reason Code:
ACCEPTED

---
drivers/nfc/nfcmrvl/main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/pci/msi/irqdomain.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/pmdomain/arm/scmi_perf_domain.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/pmdomain/arm/scmi_pm_domain.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/pmdomain/arm/scpi_pm_domain.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/pmdomain/mediatek/airoha-cpu-pmdomain.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/pmdomain/mediatek/mtk-mfg-pmdomain.c
Verdict: ACCEPTED

Evidence
FanOut: 16
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/pmdomain/st/ste-ux500-pm-domain.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/s390/cio/qdio_main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.60

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/s390/net/ctcm_main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/s390/net/qeth_core_main.c
Verdict: ACCEPTED

Evidence
FanOut: 18
Boundary Ratio: 0.94

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/s390/net/qeth_l2_main.c
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/s390/net/qeth_l3_main.c
Verdict: ACCEPTED

Evidence
FanOut: 18
Boundary Ratio: 0.94

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/s390/net/smsgiucv_app.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/scsi/be2iscsi/be_main.c
Verdict: ACCEPTED

Evidence
FanOut: 20
Boundary Ratio: 0.90

Reason Code:
ACCEPTED

---
drivers/scsi/elx/libefc/efc_domain.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/scsi/esas2r/esas2r_main.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/scsi/fdomain.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/scsi/fnic/fnic_main.c
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 0.78

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/scsi/hisi_sas/hisi_sas_main.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/scsi/mpi3mr/mpi3mr_app.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/scsi/qedf/qedf_main.c
Verdict: ACCEPTED

Evidence
FanOut: 12
Boundary Ratio: 0.83

Reason Code:
ACCEPTED

---
drivers/scsi/qedi/qedi_main.c
Verdict: ACCEPTED

Evidence
FanOut: 16
Boundary Ratio: 0.81

Reason Code:
ACCEPTED

---
drivers/scsi/snic/snic_main.c
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/sh/intc/irqdomain.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/soc/fsl/dpio/dpio-service.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/soc/rockchip/io-domain.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/ssb/main.c
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/staging/rtl8723bs/include/osdep_service.h
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/staging/rtl8723bs/os_dep/osdep_service.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/thunderbolt/domain.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/thunderbolt/xdomain.c
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/tty/ipwireless/main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/usb/mon/mon_main.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/usb/usbip/stub_main.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/usb/usbip/vudc_main.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/vdpa/ifcvf/ifcvf_main.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/vdpa/octeon_ep/octep_vdpa_main.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/vdpa/solidrun/snet_main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/vdpa/vdpa_user/iova_domain.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/vfio/cdx/main.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/vfio/container.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/vfio/pci/ism/main.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/vfio/pci/nvgrace-gpu/main.c
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/vfio/pci/qat/main.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/vfio/pci/virtio/main.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/vfio/pci/xe/main.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/vfio/vfio_main.c
Verdict: ACCEPTED

Evidence
FanOut: 16
Boundary Ratio: 0.94

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
drivers/video/fbdev/i810/i810_main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/video/fbdev/omap/omapfb_main.c
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
drivers/video/fbdev/omap2/omapfb/omapfb-main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/video/fbdev/sis/sis_main.c
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/watchdog/octeon-wdt-main.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
drivers/xen/xenbus/xenbus_client.c
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
fs/afs/cmservice.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
fs/afs/fsclient.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
fs/afs/main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
fs/afs/server.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
fs/afs/vlclient.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
fs/afs/yfsclient.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.57

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
fs/cachefiles/main.c
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
fs/ceph/mds_client.c
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
fs/ceph/mds_client.h
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
fs/dlm/main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.33

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
fs/ecryptfs/main.c
Verdict: ACCEPTED

Evidence
FanOut: 13
Boundary Ratio: 0.92

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
fs/gfs2/main.c
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.73

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
fs/netfs/fscache_main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
fs/netfs/main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
fs/nfs/client.c
Verdict: ACCEPTED

Evidence
FanOut: 36
Boundary Ratio: 0.86

Reason Code:
ACCEPTED

---
fs/nfs/nfs3client.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
fs/nfs/nfs40client.c
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
fs/nfs/nfs4client.c
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.73

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
fs/ocfs2/dlm/dlmdomain.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
fs/smb/server/server.c
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.69

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
fs/smb/server/server.h
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
fs/smb/smbdirect/main.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
include/drm/drm_client.h
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
include/linux/attribute_container.h
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
include/linux/ceph/cls_lock_client.h
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
include/linux/ceph/mon_client.h
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
include/linux/ceph/osd_client.h
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.70

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
include/linux/container.h
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
include/linux/device-id/tee_client.h
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
include/linux/firmware/intel/stratix10-svc-client.h
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
include/linux/mailbox_client.h
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
include/linux/net/intel/i40e_client.h
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
include/net/9p/client.h
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
init/main.c
Verdict: ACCEPTED

Evidence
FanOut: 64
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
kernel/debug/kdb/kdb_main.c
Verdict: ACCEPTED

Evidence
FanOut: 19
Boundary Ratio: 0.95

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
kernel/exec_domain.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
kernel/irq/irqdomain.c
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
kernel/module/main.c
Verdict: ACCEPTED

Evidence
FanOut: 30
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
kernel/trace/rv/monitors/rtapp/rtapp.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
lib/crc/crc-t10dif-main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
lib/crc/crc32-main.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
lib/crc/crc64-main.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
net/9p/client.c
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
net/batman-adv/gateway_client.c
Verdict: ACCEPTED

Evidence
FanOut: 25
Boundary Ratio: 0.84

Reason Code:
ACCEPTED

---
net/batman-adv/gateway_client.h
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
net/batman-adv/main.c
Verdict: REJECTED

Evidence
FanOut: 39
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
net/can/j1939/main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
net/ceph/cls_lock_client.c
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
net/ceph/mon_client.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
net/ceph/osd_client.c
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
net/hsr/hsr_main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
net/ipv4/netfilter/nf_nat_snmp_basic_main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
net/ipv6/ila/ila_main.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
net/mac80211/main.c
Verdict: ACCEPTED

Evidence
FanOut: 20
Boundary Ratio: 0.85

Reason Code:
ACCEPTED

---
net/mac802154/main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
net/netfilter/ipvs/ip_vs_app.c
Verdict: ACCEPTED

Evidence
FanOut: 11
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
net/netfilter/nf_conntrack_h323_main.c
Verdict: ACCEPTED

Evidence
FanOut: 20
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
net/psp/psp_main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
net/rxrpc/conn_client.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
net/rxrpc/conn_service.c
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
net/rxrpc/rxgk_app.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.60

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
net/sunrpc/xprtrdma/ib_client.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
net/tls/tls_main.c
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
security/apparmor/domain.c
Verdict: ACCEPTED

Evidence
FanOut: 15
Boundary Ratio: 0.93

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
security/integrity/evm/evm_main.c
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
security/integrity/ima/ima_main.c
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
security/landlock/domain.c
Verdict: ACCEPTED

Evidence
FanOut: 11
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
security/selinux/ss/services.c
Verdict: ACCEPTED

Evidence
FanOut: 21
Boundary Ratio: 0.81

Reason Code:
ACCEPTED

---
security/selinux/ss/services.h
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
security/tomoyo/domain.c
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
sound/core/seq/seq_ump_client.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
sound/isa/gus/gus_main.c
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
sound/isa/sb/sb16_main.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
sound/isa/sb/sb8_main.c
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
sound/pci/ca0106/ca0106_main.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
sound/pci/emu10k1/emu10k1_main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
sound/pci/trident/trident_main.c
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
sound/pci/ymfpci/ymfpci_main.c
Verdict: ACCEPTED

Evidence
FanOut: 11
Boundary Ratio: 0.91

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
sound/soc/sof/sof-client.c
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.57

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
sound/soc/sof/sof-client.h
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
virt/kvm/kvm_main.c
Verdict: ACCEPTED

Evidence
FanOut: 23
Boundary Ratio: 0.87

Reason Code:
ACCEPTED

---

## 5. Knowledge Connectivity
<details><summary><b>Show Knowledge Sources</b></summary>

- [drivers/gpu/drm/tidss/tidss_plane.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/tidss/tidss_plane.c) -> drivers/gpu/drm/tidss/tidss_crtc.c
- [drivers/staging/media/atomisp/pci/isp/kernels/qplane/qplane_2/ia_css_qplane.host.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/staging/media/atomisp/pci/isp/kernels/qplane/qplane_2/ia_css_qplane.host.c) -> drivers/media/platform/ti/omap3isp/isp.c
- [drivers/gpu/drm/amd/display/amdgpu_dm/amdgpu_dm_plane.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/amd/display/amdgpu_dm/amdgpu_dm_plane.c) -> drivers/gpu/drm/amd/display/amdgpu_dm/amdgpu_dm_trace.h
- [drivers/gpu/drm/vc4/tests/vc4_mock_plane.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/vc4/tests/vc4_mock_plane.c) -> drivers/gpu/drm/vc4/tests/vc4_mock.c
- [drivers/gpu/drm/i915/display/skl_universal_plane.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/i915/display/skl_universal_plane.c) -> drivers/gpu/drm/drm_print.c
- [drivers/gpu/drm/verisilicon/vs_primary_plane.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/verisilicon/vs_primary_plane.c) -> drivers/gpu/drm/verisilicon/vs_primary_plane_regs.h
- [drivers/gpu/drm/armada/armada_plane.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/armada/armada_plane.c) -> drivers/gpu/drm/armada/armada_drm.h
- [drivers/gpu/drm/drm_plane.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/drm_plane.c) -> drivers/gpu/drm/drm_drv.c
- [drivers/gpu/drm/sti/sti_plane.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/sti/sti_plane.c) -> drivers/gpu/drm/drm_print.c
- [drivers/gpu/drm/imx/dcss/dcss-plane.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/imx/dcss/dcss-plane.c) -> drivers/gpu/drm/imx/dcss/dcss-dev.c
- [drivers/gpu/drm/msm/disp/mdp5/mdp5_plane.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/msm/disp/mdp5/mdp5_plane.c) -> drivers/gpu/drm/msm/disp/mdp5/mdp5_kms.c
- [drivers/staging/media/atomisp/pci/isp/kernels/qplane/qplane_2/ia_css_qplane.host.h](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/staging/media/atomisp/pci/isp/kernels/qplane/qplane_2/ia_css_qplane.host.h) -> drivers/staging/media/atomisp/pci/isp/kernels/qplane/qplane_2/ia_css_qplane_param.h
- [drivers/gpu/drm/msm/disp/dpu1/dpu_plane.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/msm/disp/dpu1/dpu_plane.c) -> drivers/gpu/drm/msm/disp/dpu1/dpu_hw_sspp.c
- [drivers/gpu/drm/verisilicon/vs_primary_plane.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/verisilicon/vs_primary_plane.c) -> drivers/gpu/drm/drm_atomic.c
- [drivers/gpu/drm/renesas/rcar-du/rcar_du_plane.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/renesas/rcar-du/rcar_du_plane.c) -> drivers/gpu/drm/drm_fourcc.c
- [drivers/gpu/drm/verisilicon/vs_cursor_plane.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/verisilicon/vs_cursor_plane.c) -> drivers/gpu/drm/verisilicon/vs_plane.c
- [drivers/gpu/drm/renesas/rcar-du/rcar_du_plane.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/renesas/rcar-du/rcar_du_plane.c) -> include/drm/drm_device.h
- [drivers/video/fbdev/c2p_iplan2.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/video/fbdev/c2p_iplan2.c) -> drivers/video/fbdev/c2p.h
- [drivers/gpu/drm/verisilicon/vs_plane.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/verisilicon/vs_plane.c) -> arch/s390/boot/printk.c
- [drivers/gpu/drm/imx/dc/dc-plane.c](vscode://file//home/dogsinatas/다운로드/linux-7.2-rc3/drivers/gpu/drm/imx/dc/dc-plane.c) -> drivers/gpu/drm/drm_atomic_state_helper.c
</details>

## 7. Architectural Reasoning
*Reasoning Pipeline was not executed or results unavailable.*

## 8. Architecture State Report

*AnomalyCollector not available.*

## 6. Raw Metrics
### 6.1 Global Metrics
- **Boundary Ratio**: 76.7%

### 6.2 Source Breakdown (ASR 3.0)
#### Ghost Source Top N
  - N/A

#### Coupling Source Top N
  - **drivers**: 82894 (31.1%)
  - **include**: 73795 (27.7%)
  - **arch**: 46392 (17.4%)
  - **tools**: 14078 (5.3%)
  - **net**: 11517 (4.3%)
  - ...