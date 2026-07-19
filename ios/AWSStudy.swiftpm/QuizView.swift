import SwiftUI

struct QuizSession: Identifiable {
    let id = UUID()
    let questions: [Question]
    let label: String
}

struct QuizView: View {
    let session: QuizSession
    @EnvironmentObject private var store: ProgressStore
    @Environment(\.dismiss) private var dismiss

    @State private var index = 0
    @State private var correctCount = 0
    @State private var wrongQuestions: [Question] = []
    @State private var selectedChoice: Int?
    @State private var choiceOrder: [Int] = []
    @State private var finished = false
    @State private var retrySession: QuizSession?

    private var current: Question { session.questions[index] }
    private var isAnswered: Bool { selectedChoice != nil }

    var body: some View {
        NavigationStack {
            Group {
                if finished {
                    resultView
                } else {
                    questionView
                }
            }
            .navigationTitle(session.label)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("閉じる") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Text("\(min(index + 1, session.questions.count)) / \(session.questions.count)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .fullScreenCover(item: $retrySession) { retry in
                QuizView(session: retry)
            }
            .onAppear { shuffleChoices() }
        }
    }

    // MARK: - 出題画面

    private var questionView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                ProgressView(value: Double(index), total: Double(session.questions.count))
                    .tint(.orange)

                Text(current.question)
                    .font(.body.bold())
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 14))

                VStack(spacing: 10) {
                    ForEach(choiceOrder, id: \.self) { choiceIdx in
                        choiceButton(choiceIdx)
                    }
                }

                if isAnswered {
                    explanationCard
                    Button {
                        advance()
                    } label: {
                        Text(index + 1 < session.questions.count ? "次の問題" : "結果を見る")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                }
            }
            .padding()
        }
        .animation(.easeOut(duration: 0.2), value: isAnswered)
    }

    private func choiceButton(_ choiceIdx: Int) -> some View {
        let state = choiceState(choiceIdx)
        return Button {
            answer(choiceIdx)
        } label: {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: state.icon)
                    .foregroundStyle(state.color)
                Text(current.choices[choiceIdx])
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding()
            .background(state.color.opacity(state.isNeutral ? 0.0 : 0.12),
                        in: RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(state.color.opacity(state.isNeutral ? 0.3 : 1), lineWidth: 1))
        }
        .buttonStyle(.plain)
        .disabled(isAnswered)
        .opacity(isAnswered && state.isNeutral ? 0.45 : 1)
    }

    private struct ChoiceState {
        let icon: String
        let color: Color
        let isNeutral: Bool
    }

    private func choiceState(_ choiceIdx: Int) -> ChoiceState {
        guard isAnswered else { return ChoiceState(icon: "circle", color: .secondary, isNeutral: true) }
        if choiceIdx == current.answer {
            return ChoiceState(icon: "checkmark.circle.fill", color: .green, isNeutral: false)
        }
        if choiceIdx == selectedChoice {
            return ChoiceState(icon: "xmark.circle.fill", color: .red, isNeutral: false)
        }
        return ChoiceState(icon: "circle", color: .secondary, isNeutral: true)
    }

    private var explanationCard: some View {
        let isCorrect = selectedChoice == current.answer
        return VStack(alignment: .leading, spacing: 8) {
            Label(isCorrect ? "正解!" : "不正解",
                  systemImage: isCorrect ? "checkmark.seal.fill" : "xmark.seal.fill")
                .font(.subheadline.bold())
                .foregroundStyle(isCorrect ? .green : .red)
            Text(current.explanation)
                .font(.subheadline)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 14))
        .overlay(alignment: .leading) {
            Rectangle().fill(.orange).frame(width: 4).clipShape(RoundedRectangle(cornerRadius: 2))
        }
    }

    // MARK: - 結果画面

    private var resultView: some View {
        let total = session.questions.count
        let rate = Double(correctCount) / Double(max(total, 1))
        let (emoji, title, message): (String, String, String) =
            rate == 1 ? ("🏆", "全問正解!", "完璧です。次のカテゴリへ進みましょう。")
            : rate >= 0.7 ? ("🎉", "合格ライン!", "SAA の合格ラインは約 72%。この調子で弱点を潰しましょう。")
            : rate >= 0.4 ? ("📚", "あと一歩", "解説を読み直して、弱点復習モードで定着させましょう。")
            : ("💪", "これから伸びる", "間違いは学習のチャンス。もう一度挑戦しましょう。")

        return VStack(spacing: 16) {
            Text(emoji).font(.system(size: 56))
            Text(title).font(.title2.bold())
            Text("\(correctCount) / \(total) 問正解")
                .font(.title3)
                .foregroundStyle(.orange)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            if !wrongQuestions.isEmpty {
                Button {
                    retrySession = QuizSession(questions: wrongQuestions.shuffled(), label: "間違い直し")
                } label: {
                    Label("間違えた \(wrongQuestions.count) 問をやり直す", systemImage: "arrow.counterclockwise")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .controlSize(.large)
            }

            Button {
                dismiss()
            } label: {
                Text("ホームへ戻る").frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
        }
        .padding(24)
    }

    // MARK: - ロジック

    private func shuffleChoices() {
        choiceOrder = Array(current.choices.indices).shuffled()
    }

    private func answer(_ choiceIdx: Int) {
        guard !isAnswered else { return }
        selectedChoice = choiceIdx
        let isCorrect = choiceIdx == current.answer
        store.record(id: current.id, isCorrect: isCorrect)
        if isCorrect {
            correctCount += 1
        } else {
            wrongQuestions.append(current)
        }
    }

    private func advance() {
        if index + 1 < session.questions.count {
            index += 1
            selectedChoice = nil
            shuffleChoices()
        } else {
            finished = true
        }
    }
}
