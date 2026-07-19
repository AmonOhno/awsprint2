import SwiftUI

struct FlashcardView: View {
    let questions: [Question]
    @Environment(\.dismiss) private var dismiss

    @State private var index = 0
    @State private var isFlipped = false

    private var current: Question { questions[index] }

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                card
                    .onTapGesture {
                        withAnimation(.spring(duration: 0.4)) { isFlipped.toggle() }
                    }

                HStack(spacing: 12) {
                    Button {
                        move(-1)
                    } label: {
                        Label("前へ", systemImage: "chevron.left")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.large)

                    Button {
                        move(1)
                    } label: {
                        Label("次へ", systemImage: "chevron.right")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                }
            }
            .padding()
            .navigationTitle("フラッシュカード")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("閉じる") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Text("\(index + 1) / \(questions.count)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private var card: some View {
        ZStack {
            face(front: true)
                .opacity(isFlipped ? 0 : 1)
                .rotation3DEffect(.degrees(isFlipped ? 180 : 0), axis: (x: 0, y: 1, z: 0))
            face(front: false)
                .opacity(isFlipped ? 1 : 0)
                .rotation3DEffect(.degrees(isFlipped ? 0 : -180), axis: (x: 0, y: 1, z: 0))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func face(front: Bool) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text(front ? "問題" : "答えと解説")
                    .font(.caption.bold())
                    .foregroundStyle(.orange)
                if front {
                    Text(current.question)
                        .font(.body.bold())
                    Spacer(minLength: 20)
                    Text("タップして答えを見る")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                } else {
                    Text(current.choices[current.answer])
                        .font(.body.bold())
                        .foregroundStyle(.green)
                    Text(current.explanation)
                        .font(.subheadline)
                }
            }
            .padding(22)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(front ? Color.secondary.opacity(0.3) : .orange, lineWidth: 1)
        )
    }

    private func move(_ delta: Int) {
        isFlipped = false
        index = (index + delta + questions.count) % questions.count
    }
}
