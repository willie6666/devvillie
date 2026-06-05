---
title: '黑客社 2026/6/9 Nix 社課 筆記'
date: '2026-06-05'
description: '用 Nix 打造可重現的 Linux 桌面'
---

vm image:  
https://fengchia-my.sharepoint.com/:u:/g/personal/d1349392_o365_fcu_edu_tw/IQAzpXlOsrVgQYauN6yacLaGAdc_eVaAgoPTO6egonek03k
<iframe src="https://fengchia-my.sharepoint.com/personal/d1349392_o365_fcu_edu_tw/_layouts/15/embed.aspx?UniqueId=4e79a533-b5b2-4160-86ae-37ac9a70b686" width="640" height="360" frameborder="0" scrolling="no" allowfullscreen title="nixos-hackersir"></iframe>

> username: user  
> password: 1234

---


```
sudo vi /etc/nixos/configuration.nix
```

/etc/nixos/configuration.nix
```nix
  services.openssh = {
    enable = true;
    openFirewall = false;
    settings = {
      PasswordAuthentication = true;
      KbdInteractiveAuthentication = false;
      PermitRootLogin = "no";
      AllowUsers = [ "user" ];
      MaxAuthTries = 3;
      PerSourcePenalties = "crash:3600s authfail:3600s max:86400s";
    };
  };
```
/etc/nixos/configuration.nix
```nix
  networking.firewall.allowedTCPPorts = [ 22 ];
```


```
sudo nixos-rebuild switch
sudo nixos-rebuild boot
sudo nixos-rebuild list-generations
```

/etc/nixos/flake.nix
```nix
{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
  };

  outputs = { self, nixpkgs }: {
    nixosConfigurations.nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";

      modules = [
        ./configuration.nix
      ];
    };
  };
}
```


```nix
  security.polkit.enable = true;

  systemd.user.services.polkit-kde-authentication-agent-1 = {
    description = "KDE Polkit Authentication Agent";
    wantedBy = [ "graphical-session.target" ];
    after = [ "graphical-session.target" ];
    partOf = [ "graphical-session.target" ];

    serviceConfig = {
      Type = "simple";
      ExecStart = "${pkgs.kdePackages.polkit-kde-agent-1}/libexec/polkit-kde-authentication-agent-1";
      Restart = "on-failure";
      RestartSec = 1;
    };
  };
```



---

# configuration.nix 初始狀態
```nix
{ config, pkgs, ... }:

{
  imports =
    [
      ./hardware-configuration.nix
    ];
  boot.loader.grub.enable = true;
  boot.loader.grub.device = "/dev/sda";
  boot.loader.grub.useOSProber = true;

  networking.hostName = "nixos";

  networking.networkmanager.enable = true;

  time.timeZone = "Asia/Taipei";

  i18n.defaultLocale = "en_US.UTF-8";

  i18n.extraLocaleSettings = {
    LC_ADDRESS = "zh_TW.UTF-8";
    LC_IDENTIFICATION = "zh_TW.UTF-8";
    LC_MEASUREMENT = "zh_TW.UTF-8";
    LC_MONETARY = "zh_TW.UTF-8";
    LC_NAME = "zh_TW.UTF-8";
    LC_NUMERIC = "zh_TW.UTF-8";
    LC_PAPER = "zh_TW.UTF-8";
    LC_TELEPHONE = "zh_TW.UTF-8";
    LC_TIME = "zh_TW.UTF-8";
  };

  services.xserver.xkb = {
    layout = "us";
    variant = "";
  };

  users.users.user = {
    isNormalUser = true;
    description = "user";
    extraGroups = [ "networkmanager" "wheel" ];
    packages = with pkgs; [];
  };

  nixpkgs.config.allowUnfree = true;

  environment.systemPackages = with pkgs; [
    vim
    git
    alacritty
    mako
    mesa-demos
    vulkan-tools
    xwayland-satellite
    noctalia-shell
    thunar
    vscode
    # firefox
  ];

  # networking.firewall.allowedTCPPorts = [ ... ];
  # networking.firewall.allowedUDPPorts = [ ... ];
  # networking.firewall.enable = false;

  system.stateVersion = "25.11"; # DONT CHANGE

  programs.niri.enable = true;
  services.displayManager.sddm.enable = true;
  services.displayManager.sddm.wayland.enable = true;
  virtualisation.vmware.guest = {
    enable = true;
    headless = false;
    package = pkgs.open-vm-tools;
  };
  
  services.upower.enable = true;
  services.power-profiles-daemon.enable = true;
}
```

# configuration.nix 最後的樣子
```nix
{ config, pkgs, ... }:

{
  imports =
    [
      ./hardware-configuration.nix
    ];
  boot.loader.grub.enable = true;
  boot.loader.grub.device = "/dev/sda";
  boot.loader.grub.useOSProber = true;

  networking.hostName = "nixos";

  networking.networkmanager.enable = true;

  time.timeZone = "Asia/Taipei";

  i18n.defaultLocale = "en_US.UTF-8";

  i18n.extraLocaleSettings = {
    LC_ADDRESS = "zh_TW.UTF-8";
    LC_IDENTIFICATION = "zh_TW.UTF-8";
    LC_MEASUREMENT = "zh_TW.UTF-8";
    LC_MONETARY = "zh_TW.UTF-8";
    LC_NAME = "zh_TW.UTF-8";
    LC_NUMERIC = "zh_TW.UTF-8";
    LC_PAPER = "zh_TW.UTF-8";
    LC_TELEPHONE = "zh_TW.UTF-8";
    LC_TIME = "zh_TW.UTF-8";
  };

  services.xserver.xkb = {
    layout = "us";
    variant = "";
  };

  users.users.user = {
    isNormalUser = true;
    description = "user";
    extraGroups = [ "networkmanager" "wheel" ];
    packages = with pkgs; [];
  };

  nixpkgs.config.allowUnfree = true;

  environment.systemPackages = with pkgs; [
    vim
    git
    alacritty
    mako
    mesa-demos
    vulkan-tools
    xwayland-satellite
    noctalia-shell
    thunar
    vscode
    firefox
  ];

  services.openssh.enable = true;

  networking.firewall.allowedTCPPorts = [ 22 ];
  # networking.firewall.allowedUDPPorts = [ ... ];
  # networking.firewall.enable = false;

  system.stateVersion = "25.11"; # DONT CHANGE

  programs.niri.enable = true;
  services.displayManager.sddm.enable = true;
  services.displayManager.sddm.wayland.enable = true;
  virtualisation.vmware.guest = {
    enable = true;
    headless = false;
    package = pkgs.open-vm-tools;
  };
  
  services.upower.enable = true;
  services.power-profiles-daemon.enable = true;

  nix.settings.experimental-features = [ "nix-command" "flakes" ];
}
```


# flake.nix 最後的樣子

```nix
{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
  };

  outputs = { self, nixpkgs }: {
    nixosConfigurations.nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";

      modules = [
        ./configuration.nix
      ];
    };
  };
}
```
