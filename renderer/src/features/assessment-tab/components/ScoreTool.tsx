import { ScoreToolView } from './ScoreTool/components';
import { useScoreToolController } from './ScoreTool/hooks';

export function ScoreTool() {
  const viewModel = useScoreToolController();
  return <ScoreToolView viewModel={viewModel} />;
}
