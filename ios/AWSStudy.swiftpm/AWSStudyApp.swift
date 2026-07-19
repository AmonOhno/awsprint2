import SwiftUI

@main
struct AWSStudyApp: App {
    @StateObject private var store = ProgressStore()

    var body: some Scene {
        WindowGroup {
            HomeView()
                .environmentObject(store)
                .preferredColorScheme(.dark)
                .tint(.orange)
        }
    }
}
