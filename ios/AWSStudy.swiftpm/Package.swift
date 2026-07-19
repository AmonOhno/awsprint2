// swift-tools-version: 5.9

// AWS Study iOS アプリ(App Playground 形式)
// Xcode または iPad の Swift Playgrounds で開いてそのまま実行できる。
// 無料の Apple ID のみで実機インストール可能(ゼロコスト方針: docs/RULES.md)。
import PackageDescription
import AppleProductTypes

let package = Package(
    name: "AWSStudy",
    platforms: [
        .iOS("16.0")
    ],
    products: [
        .iOSApplication(
            name: "AWSStudy",
            targets: ["AppModule"],
            bundleIdentifier: "com.awsstudy.quiz",
            displayVersion: "1.0",
            bundleVersion: "1",
            appIcon: .placeholder(icon: .cloud),
            accentColor: .presetColor(.orange),
            supportedDeviceFamilies: [
                .pad,
                .phone
            ],
            supportedInterfaceOrientations: [
                .portrait,
                .landscapeRight,
                .landscapeLeft
            ]
        )
    ],
    targets: [
        .executableTarget(
            name: "AppModule",
            path: ".",
            resources: [
                .process("Resources")
            ]
        )
    ]
)
