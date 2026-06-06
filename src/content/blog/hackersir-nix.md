---
title: '黑客社 2026/6/9 Nix 社課 筆記'
date: '2026-06-05'
description: '用 Nix 打造可重現的 Linux 桌面'
---

簡報檔:  
<a href="/assets/用 Nix 打造可重現的 Linux 桌面.pdf" target="_blank">用 Nix 打造可重現的 Linux 桌面.pdf</a>

vm image:  
https://fengchia-my.sharepoint.com/:u:/g/personal/d1349392_o365_fcu_edu_tw/IQAzpXlOsrVgQYauN6yacLaGAdc_eVaAgoPTO6egonek03k

> username: user  
> password: 1234

> Super+T: 開啟 Terminal  
> Super+Q: 關閉視窗  
> Super+數字: 切換桌面  
> Super+Ctrl+數字: 將目前視窗移至該桌面  
> Super+滑鼠左右鍵: 拖曳、縮放視窗

---


```
sudo vi /etc/nixos/configuration.nix
```

## SSH
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

/etc/nixos/configuration.nix
```nix
nix.settings.experimental-features = [ "nix-command" "flakes" ];
```

## flake
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

/etc/nixos/
```
sudo nix flake update
sudo nixos-rebuild switch --flake
```

## direnv
/etc/nixos/configuration.nix
```nix
programs.direnv.enable = true;
```

~/hello/shell.nix
```nix
{ pkgs ? import <nixpkgs> {}}:

pkgs.mkShell {
  packages = with pkgs; [
    python3
    hello
  ];
}
```

```
echo "use nix" >> .envrc
direnv allow
```

---

# Linux Ricing

## 更改畫面縮放
```
niri msg outputs
```

```kdl
output "Virtual-1"{
  scale 1.5
}
```

## Home-Manager
/etc/nixos/flake.nix
```nix
{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";

    home-manager = {
      url = "github:nix-community/home-manager/release-26.05";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    catppuccin.url = "github:catppuccin/nix/release-26.05";
  };

  outputs = { self, nixpkgs, home-manager, catppuccin }@inputs: {
    nixosConfigurations.nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";

      modules = [
        ./configuration.nix

        home-manager.nixosModules.home-manager {
          home-manager.useGlobalPkgs = true;
          home-manager.useUserPackages = true;

          home-manager.extraSpecialArgs = {
            inherit inputs;
          };

          home-manager.users.user = {
            imports = [
              ./home.nix
              catppuccin.homeModules.catppuccin
            ];
          };
        }
      ];
    };
  };
}
```

## QT, GTK 主題
/etc/nixos/home.nix
```nix
{ config, pkgs, ... }:

let
  catppuccinGtk = pkgs.magnetic-catppuccin-gtk.override {
    accent = [ "mauve" ];
    shade = "dark";
    size = "standard";
    tweaks = [ ];
  };
in
{
  home.username = "user";
  home.homeDirectory = "/home/user";

  home.stateVersion = "26.05";

  programs.home-manager.enable = true;

  home.packages = with pkgs; [
    fastfetch
    
    libsForQt5.qt5ct
    qt6Packages.qt6ct

    libsForQt5.qtstyleplugin-kvantum
    qt6Packages.qtstyleplugin-kvantum

    catppuccinGtk
  ];

  catppuccin = {
    enable = true;
    flavor = "mocha";
    accent = "mauve";
  };

  gtk = {
    enable = true;

    theme = {
      name = "Catppuccin-GTK-Mauve-Dark";
      package = catppuccinGtk;
    };

    cursorTheme = {
      name = "catppuccin-mocha-mauve-cursors";
      package = pkgs.catppuccin-cursors.mochaMauve;
      size = 24;
    };

    colorScheme = "dark";
  };

  qt = {
    enable = true;
    platformTheme.name = "qtct";

    style = {
      name = "kvantum";
    };

    qt5ctSettings = {
      Appearance = {
        style = "kvantum";
        standard_dialogs = "xdgdesktopportal";
      };
    };

    qt6ctSettings = {
      Appearance = {
        style = "kvantum";
        standard_dialogs = "xdgdesktopportal";
      };
    };
  };

  catppuccin.kvantum = {
    enable = true;
    flavor = "mocha";
    accent = "mauve";
    apply = true;
  };

  catppuccin.qt5ct = {
    enable = true;
    flavor = "mocha";
    accent = "mauve";
  };
}
```

~/.config/niri/config.kdl
```kdl
Mod+D hotkey-overlay-title="Run an Application: fuzzel" { spawn-sh "noctalia-shell ipc call launcher toggle"; }
```

~/.config/niri/config.kdl
```kdl
prefer-no-csd
```


/etc/nixos/configuration.nix
```nix
  programs.thunar.enable = true;
  programs.xfconf.enable = true;
  services.gvfs.enable = true;
  services.tumbler.enable = true;
```

https://github.com/catppuccin/kitty

~/.config/niri/config.kdl
```kdl
window-rule {
    match app-id="kitty"
    opacity 0.95
}

window-rule {
    match app-id="thunar"
    opacity 0.95
}
```


## 所有設定檔: <a href="/blog/hackersir-nix-configs" target="_blank">黑客社 2026/6/9 Nix 社課 設定檔</a>