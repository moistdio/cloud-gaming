FROM ubuntu:22.04

# Umgebungsvariablen setzen
ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:1
ENV VNC_PORT=5901
ENV WEB_PORT=6081
ENV VNC_PASSWORD=password

# System aktualisieren und grundlegende Pakete installieren
RUN apt-get update && apt-get install -y \
    ubuntu-desktop-minimal \
    tightvncserver \
    novnc \
    websockify \
    xfce4 \
    xfce4-goodies \
    firefox \
    libreoffice \
    gedit \
    file-manager \
    git \
    curl \
    wget \
    nano \
    htop \
    unzip \
    software-properties-common \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Benutzer erstellen
RUN useradd -m -s /bin/bash user && \
    echo "user:password" | chpasswd && \
    usermod -aG sudo user

# VNC-Verzeichnis erstellen
RUN mkdir -p /home/user/.vnc

# VNC-Startup-Script erstellen
RUN echo '#!/bin/bash\n\
xrdb $HOME/.Xresources\n\
xsetroot -solid grey\n\
export XKL_XMODMAP_DISABLE=1\n\
/etc/X11/Xsession\n\
' > /home/user/.vnc/xstartup

# VNC-Passwort setzen
RUN echo "password" | vncpasswd -f > /home/user/.vnc/passwd

# Berechtigungen setzen
RUN chown -R user:user /home/user/.vnc && \
    chmod 600 /home/user/.vnc/passwd && \
    chmod +x /home/user/.vnc/xstartup

# Desktop-Umgebung konfigurieren
RUN echo "startxfce4 &" >> /home/user/.vnc/xstartup

# noVNC Web-Interface konfigurieren
RUN ln -s /usr/share/novnc/vnc.html /usr/share/novnc/index.html

# Startup-Script erstellen
COPY start-desktop.sh /usr/local/bin/start-desktop.sh
RUN chmod +x /usr/local/bin/start-desktop.sh

# Ports freigeben
EXPOSE 5901 6081

# Arbeitsverzeichnis setzen
WORKDIR /home/user

# Als user ausführen
USER user

# Desktop starten
CMD ["/usr/local/bin/start-desktop.sh"] 